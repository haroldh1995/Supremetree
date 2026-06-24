import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { powerDefinitions } from '../data/powers'
import { calculateConvergenceReport } from '../domain/convergence'
import { calculateLivingAnswerReport } from '../domain/livingAnswer'
import { performDraw, secureRandomProvider, type RandomProvider } from '../domain/randomizer'
import { calculateScheduleReport } from '../domain/schedule'
import type {
  AdvancementNarrative,
  AppData,
  CampaignSettings,
  CatchUpCredit,
  DrawKind,
  DrawResult,
  LivingAnswerRecord,
  MilestoneRequirement,
  PowerProgress,
  PowerState,
  SessionRecord,
} from '../domain/types'
import { validatePowerDefinitions } from '../domain/validation'
import {
  commitDraw,
  createCampaign,
  createDefaultSettings,
  createSession,
  defaultUiPreferences,
  deleteSession,
  exportBackup,
  grantCatchUpCredit,
  importBackup,
  loadAppData,
  manualAdvancePower,
  overridePowerState,
  recordDrawCancelled,
  recordReroll,
  resetCampaign,
  revealLivingAnswer,
  setLivingAnswerFullyActive,
  undoMostRecent,
  updateCatchUpCredit,
  updatePowerProgress,
  updateRequirement,
  updateSession,
  updateSettings,
} from '../persistence/repository'

interface AppStateValue {
  data: AppData
  ready: boolean
  validationErrors: string[]
  powerProgressById: Map<string, PowerProgress>
  schedule: ReturnType<typeof calculateScheduleReport> | null
  convergence: ReturnType<typeof calculateConvergenceReport> | null
  livingReport: ReturnType<typeof calculateLivingAnswerReport> | null
  actions: {
    createCampaign: typeof createCampaign
    createSession: typeof createSession
    updateSession: typeof updateSession
    deleteSession: typeof deleteSession
    updateSettings: typeof updateSettings
    commitDraw: typeof commitDraw
    recordReroll: typeof recordReroll
    recordDrawCancelled: typeof recordDrawCancelled
    manualAdvancePower: typeof manualAdvancePower
    updatePowerProgress: typeof updatePowerProgress
    overridePowerState: typeof overridePowerState
    updateCatchUpCredit: typeof updateCatchUpCredit
    grantCatchUpCredit: typeof grantCatchUpCredit
    updateRequirement: typeof updateRequirement
    revealLivingAnswer: typeof revealLivingAnswer
    setLivingAnswerFullyActive: typeof setLivingAnswerFullyActive
    undoMostRecent: typeof undoMostRecent
    exportBackup: typeof exportBackup
    importBackup: typeof importBackup
    resetCampaign: typeof resetCampaign
    previewDraw(input: {
      sessionId: string
      kind: DrawKind
      overrideCooldown?: boolean
      overrideDuplicate?: boolean
      provider?: RandomProvider
    }): DrawResult
    createDefaultSettings: typeof createDefaultSettings
  }
}

const emptyData: AppData = {
  campaign: null,
  settings: null,
  powerProgress: [],
  sessions: [],
  drawHistory: [],
  auditEvents: [],
  catchUpCredits: [],
  narrativeRequirements: [],
  livingAnswer: null,
  uiPreferences: defaultUiPreferences,
  backupMetadata: [],
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const data = useLiveQuery(loadAppData, [], undefined)
  const validation = validatePowerDefinitions()
  const currentData = data ?? emptyData
  const powerProgressById = useMemo(
    () => new Map(currentData.powerProgress.map((progress) => [progress.powerId, progress])),
    [currentData.powerProgress],
  )
  const convergence = useMemo(
    () =>
      currentData.powerProgress.length
        ? calculateConvergenceReport(currentData.powerProgress)
        : null,
    [currentData.powerProgress],
  )
  const schedule = useMemo(() => {
    if (!currentData.settings || !currentData.powerProgress.length) return null
    return calculateScheduleReport({
      settings: currentData.settings,
      progress: currentData.powerProgress,
      sessions: currentData.sessions,
      catchUpCredits: currentData.catchUpCredits,
      convergenceStagesRemaining: convergence?.stagesRemaining,
    })
  }, [
    convergence?.stagesRemaining,
    currentData.catchUpCredits,
    currentData.powerProgress,
    currentData.sessions,
    currentData.settings,
  ])
  const livingReport = useMemo(() => {
    if (!currentData.livingAnswer || !currentData.powerProgress.length) return null
    return calculateLivingAnswerReport({
      progress: currentData.powerProgress,
      narrativeRequirements: currentData.narrativeRequirements,
      livingAnswer: currentData.livingAnswer,
    })
  }, [currentData.livingAnswer, currentData.narrativeRequirements, currentData.powerProgress])

  const value: AppStateValue = {
    data: currentData,
    ready: data !== undefined,
    validationErrors: validation.errors,
    powerProgressById,
    schedule,
    convergence,
    livingReport,
    actions: {
      createCampaign,
      createSession,
      updateSession,
      deleteSession,
      updateSettings,
      commitDraw,
      recordReroll,
      recordDrawCancelled,
      manualAdvancePower,
      updatePowerProgress,
      overridePowerState,
      updateCatchUpCredit,
      grantCatchUpCredit,
      updateRequirement,
      revealLivingAnswer,
      setLivingAnswerFullyActive,
      undoMostRecent,
      exportBackup,
      importBackup,
      resetCampaign,
      createDefaultSettings,
      previewDraw(input) {
        if (!currentData.settings) throw new Error('Create a campaign before drawing.')
        return performDraw({
          settings: currentData.settings,
          progress: currentData.powerProgress,
          sessions: currentData.sessions,
          catchUpCredits: currentData.catchUpCredits,
          sessionId: input.sessionId,
          kind: input.kind,
          overrideCooldown: input.overrideCooldown,
          overrideDuplicate: input.overrideDuplicate,
          provider: input.provider ?? secureRandomProvider,
        })
      },
    },
  }

  if (!validation.valid) {
    return (
      <div className="recovery-screen" role="alert">
        <h1>Canonical power data could not be loaded</h1>
        <p>
          The app stopped before opening campaign data because the structured DOCX dataset is
          invalid.
        </p>
        <ul>
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    )
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider.')
  return context
}

export function getProgressForPower(powerId: string, progress: PowerProgress[]): PowerProgress {
  const record = progress.find((item) => item.powerId === powerId)
  if (!record) throw new Error(`Missing progress record for ${powerId}`)
  return record
}

export function summarizePowerCounts(progress: PowerProgress[]) {
  return {
    locked: progress.filter((item) => item.state === 'locked').length,
    manifested: progress.filter((item) => item.state === 'manifested').length,
    fullyRealized: progress.filter((item) => item.state === 'fully-realized').length,
  }
}

export function getLatestAttendedSession(sessions: SessionRecord[]): SessionRecord | undefined {
  return [...sessions].reverse().find((session) => session.attended)
}

export function usePowerDefinition(powerId: string) {
  return powerDefinitions.find((power) => power.id === powerId)
}

export type {
  AdvancementNarrative,
  CampaignSettings,
  CatchUpCredit,
  LivingAnswerRecord,
  MilestoneRequirement,
  PowerProgress,
  PowerState,
}
