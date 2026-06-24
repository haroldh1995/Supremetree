import { beforeEach, describe, expect, it } from 'vitest'
import { livingAnswerDefinition, ordinaryPowerDefinitions } from '../data/powers'
import { createCatchUpCreditForMissedSession, useCatchUpCredit } from './catchup'
import { calculateConvergenceReport } from './convergence'
import {
  createInitialLivingAnswer,
  calculateLivingAnswerReport,
  defaultLivingAnswerRequirements,
} from './livingAnswer'
import { advancePower, createInitialPowerProgress } from './progression'
import {
  buildDrawCandidates,
  createSeededRandomProvider,
  drawWeightedCandidate,
  ordinaryRandomPool,
  performDraw,
} from './randomizer'
import { calculateMonthlyCheckpoint, calculateScheduleReport } from './schedule'
import type { CampaignSettings, PowerProgress, SessionRecord } from './types'
import { validateBackupPayload, migrateBackupPayload, createBackupPayload } from './backup'
import { defaultUiPreferences } from '../persistence/repository'

function settings(overrides: Partial<CampaignSettings> = {}): CampaignSettings {
  return {
    campaignId: 'campaign-test',
    campaignName: 'Test Campaign',
    startDate: '2026-01-01',
    targetDate: '2027-01-01',
    defaultDurationMonths: 12,
    expectedSessionsPerMonth: 4,
    weeklySessionDay: 6,
    ordinaryCompletionMonth: 10,
    convergenceCompletionMonth: 11,
    livingAnswerRevealMonth: 12,
    catchUpRequiresApproval: true,
    automaticCatchUpCredits: true,
    cooldownAdvancements: 2,
    sameSessionDuplicateRequiresOverride: true,
    tierGatingEnabled: false,
    animationLevel: 'full',
    soundEffects: false,
    appearance: 'dark',
    density: 'comfortable',
    ...overrides,
  }
}

function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'session-1',
    sessionNumber: 1,
    date: '2026-01-03',
    attended: true,
    majorSession: false,
    bossEncounter: false,
    divineMilestone: false,
    normalAdvancements: 0,
    bonusAdvancements: 0,
    catchUpAdvancements: 0,
    powerAdvancements: [],
    manualCorrections: [],
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    ...overrides,
  }
}

describe('progression transitions', () => {
  it('moves Locked to Manifested on first advancement', () => {
    const power = ordinaryPowerDefinitions[0]!
    const progress = createInitialPowerProgress().find((item) => item.powerId === power.id)!
    const result = advancePower({
      definition: power,
      progress,
      sessionId: 's1',
      kind: 'normal',
      source: 'random',
      reason: 'test',
    })
    expect(result.previousState).toBe('locked')
    expect(result.newState).toBe('manifested')
    expect(result.progress.manifestationCount).toBe(1)
  })

  it('moves Manifested to Fully Realized on second advancement', () => {
    const power = ordinaryPowerDefinitions[0]!
    const first = advancePower({
      definition: power,
      progress: createInitialPowerProgress().find((item) => item.powerId === power.id)!,
      sessionId: 's1',
      kind: 'normal',
      source: 'random',
      reason: 'first',
    })
    const second = advancePower({
      definition: power,
      progress: first.progress,
      sessionId: 's2',
      kind: 'normal',
      source: 'random',
      reason: 'second',
    })
    expect(second.newState).toBe('fully-realized')
  })

  it('rejects advancement after Fully Realized', () => {
    const power = ordinaryPowerDefinitions[0]!
    const progress: PowerProgress = {
      ...createInitialPowerProgress().find((item) => item.powerId === power.id)!,
      state: 'fully-realized',
    }
    expect(() =>
      advancePower({
        definition: power,
        progress,
        sessionId: 's3',
        kind: 'normal',
        source: 'random',
        reason: 'bad',
      }),
    ).toThrow(/already fully realized/i)
  })
})

describe('randomizer safeguards', () => {
  let progress: PowerProgress[]
  beforeEach(() => {
    progress = createInitialPowerProgress()
  })

  it('removes fully realized powers from the ordinary draw pool', () => {
    progress = progress.map((item) =>
      item.powerId === ordinaryPowerDefinitions[0]!.id
        ? { ...item, state: 'fully-realized' }
        : item,
    )
    expect(ordinaryRandomPool(progress)).not.toContain(ordinaryPowerDefinitions[0]!.id)
  })

  it('excludes milestone-only powers and The Living Answer from random draws', () => {
    const candidates = buildDrawCandidates({
      settings: settings(),
      progress,
      sessions: [],
      catchUpCredits: [],
    })
    expect(
      candidates.find((candidate) => candidate.power.id === 'convergence-engine')?.eligible,
    ).toBe(false)
    expect(candidates.map((candidate) => candidate.power.id)).not.toContain(
      livingAnswerDefinition.id,
    )
  })

  it('honors cooldown and same-session duplicate prevention', () => {
    const power = ordinaryPowerDefinitions[0]!
    const advanced = advancePower({
      definition: power,
      progress: progress.find((item) => item.powerId === power.id)!,
      sessionId: 'session-1',
      kind: 'normal',
      source: 'random',
      reason: 'first',
    })
    progress = progress.map((item) => (item.powerId === power.id ? advanced.progress : item))
    const current = session({ powerAdvancements: [advanced.advancement] })
    const candidate = buildDrawCandidates({
      settings: settings(),
      progress,
      sessions: [current],
      catchUpCredits: [],
      currentSessionId: current.id,
    }).find((item) => item.power.id === power.id)!
    expect(candidate.ineligibleReasons).toContain('Same power already advanced during this session')
    expect(candidate.ineligibleReasons).toContain('Manifested power is still on cooldown')
  })

  it('builds weighted candidates with anti-starvation pressure', () => {
    const power = ordinaryPowerDefinitions[3]!
    progress = progress.map((item) =>
      item.powerId === power.id
        ? {
            ...item,
            state: 'manifested',
            appearanceCount: 1,
            lastAdvancedAt: '2026-01-01T00:00:00.000Z',
          }
        : item,
    )
    const sessions = [
      session({ id: 's1', powerAdvancements: [] }),
      session({ id: 's2', sessionNumber: 2, powerAdvancements: [] }),
    ]
    const candidate = buildDrawCandidates({
      settings: settings({ cooldownAdvancements: 0 }),
      progress,
      sessions,
      catchUpCredits: [],
    }).find((item) => item.power.id === power.id)!
    expect(candidate.weight).toBeGreaterThan(1)
  })

  it('is deterministic with a seeded provider', () => {
    const drawA = performDraw({
      settings: settings(),
      progress,
      sessions: [session()],
      catchUpCredits: [],
      sessionId: 'session-1',
      kind: 'normal',
      provider: createSeededRandomProvider(42),
    })
    const drawB = performDraw({
      settings: settings(),
      progress,
      sessions: [session()],
      catchUpCredits: [],
      sessionId: 'session-1',
      kind: 'normal',
      provider: createSeededRandomProvider(42),
    })
    expect(drawA.selectedPowerId).toBe(drawB.selectedPowerId)
  })

  it('applies tier gating and narrative locks', () => {
    const gatedSettings = settings({ tierGatingEnabled: true, startDate: '2026-01-01' })
    const tierThree = ordinaryPowerDefinitions.find((power) => power.tier === 3)!
    progress = progress.map((item) =>
      item.powerId === tierThree.id
        ? { ...item, narrativeLocked: true, lockReason: 'Story gate' }
        : item,
    )
    const candidate = buildDrawCandidates({
      settings: gatedSettings,
      progress,
      sessions: [],
      catchUpCredits: [],
      now: new Date('2026-01-15T00:00:00'),
    }).find((item) => item.power.id === tierThree.id)!
    expect(candidate.ineligibleReasons).toContain('Later tier not yet unlocked')
    expect(candidate.ineligibleReasons).toContain('Story gate')
  })

  it('draws only eligible weighted entries', () => {
    const candidates = buildDrawCandidates({
      settings: settings(),
      progress,
      sessions: [],
      catchUpCredits: [],
    })
    expect(drawWeightedCandidate(candidates, createSeededRandomProvider(7)).eligible).toBe(true)
  })
})

describe('schedule and catch-up math', () => {
  it('detects missed-session risk and catch-up credit creation', () => {
    const missed = session({ id: 'missed-1', attended: false })
    const credit = createCatchUpCreditForMissedSession({ settings: settings(), session: missed })
    expect(credit.remaining).toBe(1)
    expect(credit.dmApprovalRequired).toBe(true)
  })

  it('supports partial catch-up credit use', () => {
    const credit = createCatchUpCreditForMissedSession({
      settings: settings({ catchUpRequiresApproval: false }),
      session: session({ attended: false }),
      stagesOwed: 2,
    })
    const used = useCatchUpCredit(credit, 1)
    expect(used.used).toBe(1)
    expect(used.remaining).toBe(1)
  })

  it('calculates monthly checkpoints and deadline risk', () => {
    const report = calculateScheduleReport({
      settings: settings(),
      progress: createInitialPowerProgress(),
      sessions: [session({ attended: false })],
      catchUpCredits: [],
      now: new Date('2026-11-01T00:00:00'),
    })
    expect(report.status).toBe('critically-behind')
    const checkpoint = calculateMonthlyCheckpoint({
      settings: settings(),
      progress: createInitialPowerProgress(),
      sessions: [session({ attended: false })],
      catchUpCredits: [],
      month: 11,
      now: new Date('2026-11-01T00:00:00'),
    })
    expect(checkpoint.catchUpCreditsOwed).toBeGreaterThan(0)
  })
})

describe('convergence, final unlock, and backup validation', () => {
  it('advances Convergence Engine from fully realized ordinary powers', () => {
    let progress = createInitialPowerProgress()
    progress = progress.map((item) =>
      ordinaryPowerDefinitions.slice(0, 6).some((power) => power.id === item.powerId)
        ? { ...item, state: 'fully-realized' }
        : item,
    )
    expect(calculateConvergenceReport(progress).completedMilestones).toBeGreaterThan(0)
  })

  it('requires Living Answer prerequisites and keeps mana battery separate', () => {
    let progress = createInitialPowerProgress()
    progress = progress.map((item) =>
      ordinaryPowerDefinitions.some((power) => power.id === item.powerId)
        ? { ...item, state: 'fully-realized' }
        : item,
    )
    const requirements = defaultLivingAnswerRequirements().map((requirement) => ({
      ...requirement,
      complete: true,
    }))
    const report = calculateLivingAnswerReport({
      progress,
      narrativeRequirements: requirements,
      livingAnswer: createInitialLivingAnswer(),
    })
    expect(report.mechanicallyAvailable).toBe(true)
    expect(report.manaBatteryNotice).toMatch(/emergency-only/i)
  })

  it('exports, validates, migrates, and rejects invalid backup data', () => {
    const payload = createBackupPayload({
      campaign: null,
      settings: null,
      powerProgress: createInitialPowerProgress(),
      sessions: [],
      drawHistory: [],
      auditEvents: [],
      catchUpCredits: [],
      narrativeRequirements: [],
      livingAnswer: createInitialLivingAnswer(),
      uiPreferences: defaultUiPreferences,
      backupMetadata: [],
    })
    expect(validateBackupPayload(payload).schemaVersion).toBe(1)
    expect(migrateBackupPayload({ ...payload, schemaVersion: 1 }).schemaVersion).toBe(1)
    expect(() => validateBackupPayload({ bad: true })).toThrow(/invalid backup/i)
  })
})
