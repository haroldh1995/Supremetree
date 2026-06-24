import { liveQuery } from 'dexie'
import { POWER_DATA_VERSION, getPowerById } from '../data/powers'
import { createBackupPayload, migrateBackupPayload, validateBackupPayload } from '../domain/backup'
import { createCatchUpCreditForMissedSession, useCatchUpCredit } from '../domain/catchup'
import { calculateConvergenceReport, convergencePowerState } from '../domain/convergence'
import { makeId, nowIso, todayIso } from '../domain/ids'
import {
  calculateLivingAnswerReport,
  createInitialLivingAnswer,
  defaultLivingAnswerRequirements,
} from '../domain/livingAnswer'
import { advancePower, createInitialPowerProgress, setPowerState } from '../domain/progression'
import { addMonths, calculateScheduleReport, parseDateOnly } from '../domain/schedule'
import type {
  AdvancementNarrative,
  AppData,
  AuditEvent,
  AuditEventType,
  AuditSource,
  BackupMetadata,
  BackupPayload,
  Campaign,
  CampaignSettings,
  CatchUpCredit,
  DrawKind,
  DrawResult,
  LivingAnswerRecord,
  MilestoneRequirement,
  PowerProgress,
  PowerState,
  SessionRecord,
  UiPreferences,
} from '../domain/types'
import { validateProgressIntegrity } from '../domain/validation'
import { allTables, db } from './db'

export const defaultUiPreferences: UiPreferences = {
  id: 'local',
  treeZoom: 1,
  treeX: 0,
  treeY: 0,
  guidedTourDismissed: false,
}

export function createDefaultSettings(input?: Partial<CampaignSettings>): CampaignSettings {
  const campaignId = input?.campaignId ?? makeId('campaign')
  const startDate = input?.startDate ?? todayIso()
  const targetDate =
    input?.targetDate ?? addMonths(parseDateOnly(startDate), 12).toISOString().slice(0, 10)
  return {
    campaignId,
    campaignName: input?.campaignName ?? 'Dumare Campaign',
    startDate,
    targetDate,
    defaultDurationMonths: input?.defaultDurationMonths ?? 12,
    expectedSessionsPerMonth: input?.expectedSessionsPerMonth ?? 4,
    weeklySessionDay: input?.weeklySessionDay ?? 6,
    ordinaryCompletionMonth: input?.ordinaryCompletionMonth ?? 10,
    convergenceCompletionMonth: input?.convergenceCompletionMonth ?? 11,
    livingAnswerRevealMonth: input?.livingAnswerRevealMonth ?? 12,
    catchUpRequiresApproval: input?.catchUpRequiresApproval ?? true,
    automaticCatchUpCredits: input?.automaticCatchUpCredits ?? true,
    cooldownAdvancements: input?.cooldownAdvancements ?? 2,
    sameSessionDuplicateRequiresOverride: input?.sameSessionDuplicateRequiresOverride ?? true,
    tierGatingEnabled: input?.tierGatingEnabled ?? true,
    animationLevel: input?.animationLevel ?? 'full',
    soundEffects: input?.soundEffects ?? false,
    appearance: input?.appearance ?? 'dark',
    density: input?.density ?? 'comfortable',
    dmPin: input?.dmPin,
  }
}

function createAuditEvent(input: {
  type: AuditEventType
  reason: string
  source: AuditSource
  relatedSessionId?: string
  relatedPowerId?: string
  previousValue?: unknown
  newValue?: unknown
  reversible?: boolean
}): AuditEvent {
  const event: AuditEvent = {
    id: makeId('event'),
    timestamp: nowIso(),
    type: input.type,
    reason: input.reason,
    source: input.source,
    reversible: input.reversible ?? false,
  }
  if (input.relatedSessionId) event.relatedSessionId = input.relatedSessionId
  if (input.relatedPowerId) event.relatedPowerId = input.relatedPowerId
  if (input.previousValue !== undefined) event.previousValue = input.previousValue
  if (input.newValue !== undefined) event.newValue = input.newValue
  return event
}

export async function loadAppData(): Promise<AppData> {
  const [
    campaigns,
    settings,
    powerProgress,
    sessions,
    drawHistory,
    auditEvents,
    catchUpCredits,
    narrativeRequirements,
    livingAnswer,
    uiPreferences,
    backupMetadata,
  ] = await Promise.all([
    db.campaigns.toArray(),
    db.settings.toArray(),
    db.powerProgress.toArray(),
    db.sessions.orderBy('sessionNumber').toArray(),
    db.drawHistory.orderBy('timestamp').toArray(),
    db.auditEvents.orderBy('timestamp').reverse().toArray(),
    db.catchUpCredits.orderBy('dateCreated').reverse().toArray(),
    db.narrativeRequirements.toArray(),
    db.livingAnswer.toArray(),
    db.uiPreferences.toArray(),
    db.backupMetadata.toArray(),
  ])
  return {
    campaign: campaigns[0] ?? null,
    settings: settings[0] ?? null,
    powerProgress,
    sessions,
    drawHistory,
    auditEvents,
    catchUpCredits,
    narrativeRequirements,
    livingAnswer: livingAnswer[0] ?? null,
    uiPreferences: uiPreferences[0] ?? defaultUiPreferences,
    backupMetadata,
  }
}

export const appDataObservable = liveQuery(loadAppData)

async function clearDomainTables(): Promise<void> {
  await Promise.all(allTables.map((table) => table.clear()))
}

export async function createCampaign(input: Partial<CampaignSettings>): Promise<void> {
  const settings = createDefaultSettings(input)
  const timestamp = nowIso()
  const campaign: Campaign = {
    id: settings.campaignId,
    name: settings.campaignName,
    createdAt: timestamp,
    updatedAt: timestamp,
    canonicalPowerDataVersion: POWER_DATA_VERSION,
    guidedTourDismissed: false,
  }
  await db.transaction('rw', allTables, async () => {
    await clearDomainTables()
    await db.campaigns.add(campaign)
    await db.settings.add(settings)
    await db.powerProgress.bulkAdd(createInitialPowerProgress())
    await db.narrativeRequirements.bulkAdd(defaultLivingAnswerRequirements())
    await db.livingAnswer.add(createInitialLivingAnswer())
    await db.uiPreferences.add(defaultUiPreferences)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'campaign-created',
        reason: 'First launch setup completed.',
        source: 'system',
        newValue: campaign,
      }),
    )
  })
}

export async function updateSettings(settings: CampaignSettings, reason: string): Promise<void> {
  const previous = await db.settings.get(settings.campaignId)
  await db.transaction('rw', db.settings, db.campaigns, db.auditEvents, async () => {
    await db.settings.put(settings)
    const campaign = await db.campaigns.get(settings.campaignId)
    if (campaign) {
      await db.campaigns.put({ ...campaign, name: settings.campaignName, updatedAt: nowIso() })
    }
    await db.auditEvents.add(
      createAuditEvent({
        type: 'campaign-settings-changed',
        reason,
        source: 'manual',
        previousValue: previous,
        newValue: settings,
        reversible: true,
      }),
    )
  })
}

export async function createSession(input: {
  date: string
  attended: boolean
  title?: string
  summary?: string
  majorSession?: boolean
  bossEncounter?: boolean
  divineMilestone?: boolean
  dmNotes?: string
}): Promise<SessionRecord> {
  const settings = await db.settings.toCollection().first()
  if (!settings) throw new Error('Create a campaign before logging sessions.')
  const sessionNumber = (await db.sessions.count()) + 1
  const timestamp = nowIso()
  const session: SessionRecord = {
    id: makeId('session'),
    sessionNumber,
    date: input.date,
    attended: input.attended,
    title: input.title,
    summary: input.summary,
    majorSession: input.majorSession ?? false,
    bossEncounter: input.bossEncounter ?? false,
    divineMilestone: input.divineMilestone ?? false,
    normalAdvancements: 0,
    bonusAdvancements: 0,
    catchUpAdvancements: 0,
    powerAdvancements: [],
    manualCorrections: [],
    dmNotes: input.dmNotes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.transaction('rw', db.sessions, db.catchUpCredits, db.auditEvents, async () => {
    await db.sessions.add(session)
    await db.auditEvents.add(
      createAuditEvent({
        type: input.attended ? 'session-created' : 'session-missed',
        reason: input.attended
          ? 'Attended session logged.'
          : 'Missed session recorded without in-story advancement.',
        source: 'manual',
        relatedSessionId: session.id,
        newValue: session,
        reversible: true,
      }),
    )
    if (!input.attended && settings.automaticCatchUpCredits) {
      const credit = createCatchUpCreditForMissedSession({ settings, session })
      await db.catchUpCredits.add(credit)
      await db.auditEvents.add(
        createAuditEvent({
          type: 'catch-up-credit-created',
          reason: credit.reason,
          source: 'catch-up',
          relatedSessionId: session.id,
          newValue: credit,
          reversible: true,
        }),
      )
    }
  })
  return session
}

export async function updateSession(
  sessionId: string,
  patch: Partial<Omit<SessionRecord, 'id' | 'createdAt'>>,
  reason: string,
): Promise<void> {
  const previous = await db.sessions.get(sessionId)
  if (!previous) throw new Error('Session not found.')
  const updated: SessionRecord = { ...previous, ...patch, updatedAt: nowIso() }
  await db.transaction('rw', db.sessions, db.auditEvents, async () => {
    await db.sessions.put(updated)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'session-edited',
        reason,
        source: 'manual',
        relatedSessionId: sessionId,
        previousValue: previous,
        newValue: updated,
        reversible: true,
      }),
    )
  })
}

export async function deleteSession(sessionId: string, reason: string): Promise<void> {
  const previous = await db.sessions.get(sessionId)
  if (!previous) throw new Error('Session not found.')
  await db.transaction('rw', db.sessions, db.auditEvents, async () => {
    await db.sessions.delete(sessionId)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'session-deleted',
        reason,
        source: 'correction',
        relatedSessionId: sessionId,
        previousValue: previous,
        reversible: true,
      }),
    )
  })
}

async function detectAndLogConvergenceEvents(
  progress: PowerProgress[],
  reason: string,
): Promise<void> {
  const report = calculateConvergenceReport(progress)
  const convergence = progress.find((item) => item.powerId === 'convergence-engine')
  if (!convergence) return
  const computedState = convergencePowerState(progress)
  if (convergence.state === computedState) return
  const updated: PowerProgress = {
    ...convergence,
    state: computedState,
    manifestationCount: computedState === 'locked' ? 0 : 1,
    appearanceCount: Math.max(convergence.appearanceCount, report.completedMilestones),
    lastAdvancedAt: nowIso(),
  }
  await db.powerProgress.put(updated)
  await db.auditEvents.add(
    createAuditEvent({
      type: 'convergence-engine-advanced',
      reason,
      source: 'milestone',
      relatedPowerId: 'convergence-engine',
      previousValue: convergence,
      newValue: updated,
      reversible: false,
    }),
  )
}

async function updateLivingAvailability(progress: PowerProgress[], reason: string): Promise<void> {
  const living = await db.livingAnswer.get('the-living-answer')
  if (!living) return
  const requirements = await db.narrativeRequirements.toArray()
  const report = calculateLivingAnswerReport({
    progress,
    narrativeRequirements: requirements,
    livingAnswer: living,
  })
  if (
    report.mechanicallyAvailable &&
    (living.status === 'requirements-in-progress' || living.status === 'sealed')
  ) {
    const updated: LivingAnswerRecord = {
      ...living,
      status: 'mechanically-available',
      mechanicallyAvailableAt: nowIso(),
    }
    await db.livingAnswer.put(updated)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'living-answer-available',
        reason,
        source: 'milestone',
        newValue: updated,
        reversible: false,
      }),
    )
  } else if (living.status === 'sealed') {
    await db.livingAnswer.put({ ...living, status: 'requirements-in-progress' })
  }
}

export async function commitDraw(input: {
  draw: DrawResult
  reason: string
  narrative: AdvancementNarrative
  consumeCatchUpCreditId?: string
}): Promise<void> {
  const definition = getPowerById(input.draw.selectedPowerId)
  if (!definition) throw new Error('Selected power is missing from canonical data.')
  await db.transaction(
    'rw',
    [
      db.powerProgress,
      db.sessions,
      db.drawHistory,
      db.auditEvents,
      db.catchUpCredits,
      db.livingAnswer,
      db.narrativeRequirements,
    ],
    async () => {
      const progress = await db.powerProgress.get(definition.id)
      const session = await db.sessions.get(input.draw.sessionId)
      if (!progress || !session)
        throw new Error('Cannot commit draw because session or progress is missing.')
      const advanced = advancePower({
        definition,
        progress,
        sessionId: session.id,
        kind: input.draw.kind,
        source: input.draw.kind === 'catch-up' ? 'catch-up' : 'random',
        reason: input.reason,
        narrative: input.narrative,
      })
      const committedDraw: DrawResult = { ...input.draw, status: 'committed' }
      const updatedSession: SessionRecord = {
        ...session,
        normalAdvancements: session.normalAdvancements + (input.draw.kind === 'normal' ? 1 : 0),
        bonusAdvancements: session.bonusAdvancements + (input.draw.kind === 'bonus' ? 1 : 0),
        catchUpAdvancements: session.catchUpAdvancements + (input.draw.kind === 'catch-up' ? 1 : 0),
        powerAdvancements: [...session.powerAdvancements, advanced.advancement],
        updatedAt: nowIso(),
      }
      await db.powerProgress.put(advanced.progress)
      await db.sessions.put(updatedSession)
      await db.drawHistory.add(committedDraw)
      await db.auditEvents.add(
        createAuditEvent({
          type: 'random-draw-performed',
          reason: 'Draw preview committed.',
          source: committedDraw.kind === 'catch-up' ? 'catch-up' : 'random',
          relatedSessionId: session.id,
          relatedPowerId: definition.id,
          newValue: committedDraw,
        }),
      )
      await db.auditEvents.add(
        createAuditEvent({
          type: 'advancement-committed',
          reason: input.reason,
          source: committedDraw.kind === 'catch-up' ? 'catch-up' : 'random',
          relatedSessionId: session.id,
          relatedPowerId: definition.id,
          previousValue: progress,
          newValue: advanced.progress,
          reversible: true,
        }),
      )
      if (input.consumeCatchUpCreditId) {
        const credit = await db.catchUpCredits.get(input.consumeCatchUpCreditId)
        if (credit) {
          const updatedCredit = useCatchUpCredit(credit, 1)
          await db.catchUpCredits.put(updatedCredit)
          await db.auditEvents.add(
            createAuditEvent({
              type: 'catch-up-credit-used',
              reason: `Applied to ${definition.name}.`,
              source: 'catch-up',
              relatedSessionId: session.id,
              previousValue: credit,
              newValue: updatedCredit,
              reversible: true,
            }),
          )
        }
      }
      const allProgress = await db.powerProgress.toArray()
      await detectAndLogConvergenceEvents(allProgress, 'Ordinary power progression changed.')
      await updateLivingAvailability(
        await db.powerProgress.toArray(),
        'Mechanical requirements recalculated.',
      )
    },
  )
}

export async function recordReroll(draw: DrawResult, reason: string): Promise<void> {
  const rerolled: DrawResult = { ...draw, status: 'rerolled', rerollReason: reason }
  await db.transaction('rw', db.drawHistory, db.auditEvents, async () => {
    await db.drawHistory.add(rerolled)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'draw-rerolled',
        reason,
        source: 'manual',
        relatedSessionId: draw.sessionId,
        relatedPowerId: draw.selectedPowerId,
        newValue: rerolled,
      }),
    )
  })
}

export async function recordDrawCancelled(draw: DrawResult, reason: string): Promise<void> {
  const cancelled: DrawResult = { ...draw, status: 'cancelled', rerollReason: reason }
  await db.transaction('rw', db.drawHistory, db.auditEvents, async () => {
    await db.drawHistory.add(cancelled)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'draw-cancelled',
        reason,
        source: 'manual',
        relatedSessionId: draw.sessionId,
        relatedPowerId: draw.selectedPowerId,
        newValue: cancelled,
      }),
    )
  })
}

export async function manualAdvancePower(input: {
  powerId: string
  sessionId: string
  kind: DrawKind
  reason: string
  narrative?: AdvancementNarrative
}): Promise<void> {
  const definition = getPowerById(input.powerId)
  if (!definition) throw new Error('Power not found.')
  const progress = await db.powerProgress.get(input.powerId)
  const session = await db.sessions.get(input.sessionId)
  if (!progress || !session) throw new Error('Session or progress record not found.')
  const advanced = advancePower({
    definition,
    progress,
    sessionId: input.sessionId,
    kind: input.kind,
    source: 'manual',
    reason: input.reason,
    narrative: input.narrative ?? {},
  })
  await db.transaction(
    'rw',
    db.powerProgress,
    db.sessions,
    db.auditEvents,
    db.livingAnswer,
    db.narrativeRequirements,
    async () => {
      await db.powerProgress.put(advanced.progress)
      await db.sessions.put({
        ...session,
        normalAdvancements: session.normalAdvancements + (input.kind === 'normal' ? 1 : 0),
        bonusAdvancements: session.bonusAdvancements + (input.kind === 'bonus' ? 1 : 0),
        catchUpAdvancements: session.catchUpAdvancements + (input.kind === 'catch-up' ? 1 : 0),
        powerAdvancements: [...session.powerAdvancements, advanced.advancement],
        updatedAt: nowIso(),
      })
      await db.auditEvents.add(
        createAuditEvent({
          type: 'manual-advancement',
          reason: input.reason,
          source: 'manual',
          relatedSessionId: input.sessionId,
          relatedPowerId: input.powerId,
          previousValue: progress,
          newValue: advanced.progress,
          reversible: true,
        }),
      )
      await detectAndLogConvergenceEvents(await db.powerProgress.toArray(), input.reason)
      await updateLivingAvailability(await db.powerProgress.toArray(), input.reason)
    },
  )
}

export async function updatePowerProgress(progress: PowerProgress, reason: string): Promise<void> {
  const previous = await db.powerProgress.get(progress.powerId)
  await db.transaction('rw', db.powerProgress, db.auditEvents, async () => {
    await db.powerProgress.put(progress)
    await db.auditEvents.add(
      createAuditEvent({
        type: progress.narrativeLocked ? 'power-locked' : 'power-edited',
        reason,
        source: 'manual',
        relatedPowerId: progress.powerId,
        previousValue: previous,
        newValue: progress,
        reversible: true,
      }),
    )
  })
}

export async function overridePowerState(
  powerId: string,
  state: PowerState,
  reason: string,
): Promise<void> {
  const progress = await db.powerProgress.get(powerId)
  if (!progress) throw new Error('Power progress not found.')
  await updatePowerProgress(setPowerState(progress, state, reason), reason)
}

export async function updateCatchUpCredit(credit: CatchUpCredit, reason: string): Promise<void> {
  const previous = await db.catchUpCredits.get(credit.id)
  await db.transaction('rw', db.catchUpCredits, db.auditEvents, async () => {
    await db.catchUpCredits.put(credit)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'catch-up-credit-updated',
        reason,
        source: 'manual',
        previousValue: previous,
        newValue: credit,
        reversible: true,
      }),
    )
  })
}

export async function grantCatchUpCredit(input: {
  settings: CampaignSettings
  stages: number
  reason: string
  notes?: string
}): Promise<void> {
  const credit: CatchUpCredit = {
    id: makeId('credit'),
    dateCreated: nowIso(),
    reason: input.reason,
    campaignMonth: calculateScheduleReport({
      settings: input.settings,
      progress: await db.powerProgress.toArray(),
      sessions: await db.sessions.toArray(),
      catchUpCredits: await db.catchUpCredits.toArray(),
    }).campaignMonth,
    stagesOwed: input.stages,
    used: 0,
    remaining: input.stages,
    dmApprovalRequired: input.settings.catchUpRequiresApproval,
    status: input.settings.catchUpRequiresApproval ? 'pending' : 'approved',
    relatedMissedSessionIds: [],
    notes: input.notes,
  }
  await db.transaction('rw', db.catchUpCredits, db.auditEvents, async () => {
    await db.catchUpCredits.add(credit)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'catch-up-credit-created',
        reason: input.reason,
        source: 'manual',
        newValue: credit,
        reversible: true,
      }),
    )
  })
}

export async function updateRequirement(
  requirement: MilestoneRequirement,
  reason: string,
): Promise<void> {
  const previous = await db.narrativeRequirements.get(requirement.id)
  await db.transaction(
    'rw',
    db.narrativeRequirements,
    db.livingAnswer,
    db.powerProgress,
    db.auditEvents,
    async () => {
      await db.narrativeRequirements.put(requirement)
      await db.auditEvents.add(
        createAuditEvent({
          type: 'milestone-completed',
          reason,
          source: 'manual',
          previousValue: previous,
          newValue: requirement,
          reversible: true,
        }),
      )
      await updateLivingAvailability(await db.powerProgress.toArray(), reason)
    },
  )
}

export async function revealLivingAnswer(reason: string): Promise<void> {
  const living = await db.livingAnswer.get('the-living-answer')
  if (!living) throw new Error('Living Answer record missing.')
  const updated: LivingAnswerRecord = {
    ...living,
    status: 'narratively-revealed',
    narrativeRevealConfirmedAt: nowIso(),
  }
  await db.transaction('rw', db.livingAnswer, db.auditEvents, async () => {
    await db.livingAnswer.put(updated)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'living-answer-revealed',
        reason,
        source: 'manual',
        previousValue: living,
        newValue: updated,
        reversible: true,
      }),
    )
  })
}

export async function setLivingAnswerFullyActive(reason: string): Promise<void> {
  const living = await db.livingAnswer.get('the-living-answer')
  if (!living) throw new Error('Living Answer record missing.')
  const updated: LivingAnswerRecord = { ...living, status: 'fully-active', fullyActiveAt: nowIso() }
  await db.transaction('rw', db.livingAnswer, db.auditEvents, async () => {
    await db.livingAnswer.put(updated)
    await db.auditEvents.add(
      createAuditEvent({
        type: 'living-answer-fully-active',
        reason,
        source: 'manual',
        previousValue: living,
        newValue: updated,
        reversible: true,
      }),
    )
  })
}

export async function undoMostRecent(): Promise<void> {
  const event = await db.auditEvents
    .orderBy('timestamp')
    .reverse()
    .filter((candidate) => candidate.reversible && !candidate.undoneByEventId)
    .first()
  if (!event) throw new Error('No recent reversible operation is available.')
  const undoEvent = createAuditEvent({
    type: 'undo-performed',
    reason: `Undo ${event.type}`,
    source: 'correction',
    previousValue: event.newValue,
    newValue: event.previousValue,
  })
  await db.transaction(
    'rw',
    [
      db.powerProgress,
      db.sessions,
      db.catchUpCredits,
      db.auditEvents,
      db.settings,
      db.livingAnswer,
    ],
    async () => {
      if (
        (event.type === 'advancement-committed' || event.type === 'manual-advancement') &&
        event.relatedPowerId &&
        event.previousValue
      ) {
        await db.powerProgress.put(event.previousValue as PowerProgress)
        if (event.relatedSessionId) {
          const session = await db.sessions.get(event.relatedSessionId)
          if (session) {
            await db.sessions.put({
              ...session,
              powerAdvancements: session.powerAdvancements.filter(
                (advancement) => advancement.powerId !== event.relatedPowerId,
              ),
              updatedAt: nowIso(),
            })
          }
        }
      }
      if (event.type === 'session-created' && event.relatedSessionId) {
        await db.sessions.delete(event.relatedSessionId)
      }
      if (event.type === 'session-deleted' && event.previousValue) {
        await db.sessions.put(event.previousValue as SessionRecord)
      }
      if (event.type === 'catch-up-credit-used' && event.previousValue) {
        await db.catchUpCredits.put(event.previousValue as CatchUpCredit)
      }
      if (event.type === 'campaign-settings-changed' && event.previousValue) {
        await db.settings.put(event.previousValue as CampaignSettings)
      }
      if (event.type === 'living-answer-revealed' && event.previousValue) {
        await db.livingAnswer.put(event.previousValue as LivingAnswerRecord)
      }
      await db.auditEvents.update(event.id, { undoneByEventId: undoEvent.id })
      await db.auditEvents.add(undoEvent)
    },
  )
}

export async function exportBackup(): Promise<BackupPayload> {
  return createBackupPayload(await loadAppData())
}

export async function importBackup(raw: unknown): Promise<void> {
  const payload = migrateBackupPayload(validateBackupPayload(raw))
  const validation = validateProgressIntegrity({
    progress: payload.powerProgress,
    allowLegacyFullyRealized: true,
  })
  if (!validation.valid) {
    throw new Error(`Imported progress is invalid: ${validation.errors.join(', ')}`)
  }
  const metadata: BackupMetadata = {
    id: makeId('backup'),
    createdAt: nowIso(),
    reason: 'Import snapshot before overwrite',
    filename: 'local-auto-snapshot',
  }
  await db.transaction('rw', allTables, async () => {
    await clearDomainTables()
    await db.campaigns.bulkAdd(payload.campaigns)
    await db.settings.bulkAdd(payload.settings)
    await db.powerProgress.bulkAdd(payload.powerProgress)
    await db.sessions.bulkAdd(payload.sessions)
    await db.drawHistory.bulkAdd(payload.drawHistory)
    await db.auditEvents.bulkAdd(payload.auditEvents)
    await db.catchUpCredits.bulkAdd(payload.catchUpCredits)
    await db.narrativeRequirements.bulkAdd(payload.narrativeRequirements)
    await db.livingAnswer.bulkAdd(payload.livingAnswer)
    await db.uiPreferences.bulkAdd(
      payload.uiPreferences.length ? payload.uiPreferences : [defaultUiPreferences],
    )
    await db.backupMetadata.bulkAdd([...payload.backupMetadata, metadata])
    await db.auditEvents.add(
      createAuditEvent({
        type: 'import-performed',
        reason: 'Backup imported after validation.',
        source: 'import',
        newValue: { exportedAt: payload.exportedAt, schemaVersion: payload.schemaVersion },
      }),
    )
  })
}

export async function resetCampaign(reason: string): Promise<void> {
  await db.transaction('rw', allTables, async () => {
    await clearDomainTables()
    await db.auditEvents.add(
      createAuditEvent({
        type: 'campaign-reset',
        reason,
        source: 'manual',
      }),
    )
  })
}
