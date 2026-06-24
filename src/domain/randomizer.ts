import { ordinaryPowerDefinitions, powerDefinitions } from '../data/powers'
import { calculateScheduleReport } from './schedule'
import type {
  CampaignSettings,
  CatchUpCredit,
  DrawCandidate,
  DrawResult,
  PowerDefinition,
  PowerProgress,
  SessionRecord,
} from './types'
import { makeId, nowIso } from './ids'
import { nextPowerState, stateToStage } from './progression'

export interface RandomProvider {
  next(): number
}

export const secureRandomProvider: RandomProvider = {
  next() {
    const cryptoRef = globalThis.crypto
    if (cryptoRef?.getRandomValues) {
      const values = new Uint32Array(1)
      cryptoRef.getRandomValues(values)
      return (values[0] ?? 0) / 2 ** 32
    }
    return Math.random()
  },
}

export function createSeededRandomProvider(seed: number): RandomProvider {
  let state = seed >>> 0
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0
      let t = state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}

function progressById(progress: PowerProgress[]): Map<string, PowerProgress> {
  return new Map(progress.map((item) => [item.powerId, item]))
}

function advancementsSincePower(
  sessions: SessionRecord[],
  powerId: string,
  lastAdvancedAt?: string,
): number {
  const allAdvancements = sessions.flatMap((session) => session.powerAdvancements)
  if (!lastAdvancedAt) return allAdvancements.length
  return allAdvancements.filter(
    (advancement) => advancement.timestamp > lastAdvancedAt && advancement.powerId !== powerId,
  ).length
}

export function getUnlockedTier(input: {
  settings: CampaignSettings
  progress: PowerProgress[]
  now?: Date
}): number {
  if (!input.settings.tierGatingEnabled) return 99
  const start = new Date(`${input.settings.startDate}T00:00:00`)
  const now = input.now ?? new Date()
  const month = Math.max(
    1,
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1,
  )
  const fullyRealized = input.progress.filter((item) => item.state === 'fully-realized').length
  if (month >= 10 || fullyRealized >= 14) return 4
  if (month >= 7 || fullyRealized >= 9) return 3
  if (month >= 4 || fullyRealized >= 4) return 2
  return 1
}

export function explainPowerEligibility(input: {
  power: PowerDefinition
  progress: PowerProgress
  settings: CampaignSettings
  sessions: SessionRecord[]
  currentSessionId?: string
  overrideCooldown?: boolean
  overrideDuplicate?: boolean
  now?: Date
}): { eligible: boolean; reasons: string[]; ineligibleReasons: string[] } {
  const reasons: string[] = []
  const ineligibleReasons: string[] = []
  const unlockedTier = getUnlockedTier({
    settings: input.settings,
    progress: [],
    now: input.now,
  })
  const tier = input.progress.tierOverride ?? input.power.tier
  if (input.progress.state === 'fully-realized') {
    ineligibleReasons.push('Already fully realized')
  }
  if (!input.power.isRandomlySelectable) {
    ineligibleReasons.push('Random selection disabled by canonical data')
  }
  if (input.power.isMilestoneControlled) {
    ineligibleReasons.push('Milestone-controlled ability')
  }
  if (!input.progress.randomSelectionAllowed) {
    ineligibleReasons.push('Random selection disabled by DM')
  }
  if (input.progress.narrativeLocked) {
    ineligibleReasons.push(input.progress.lockReason || 'Narrative condition incomplete')
  }
  if (input.progress.temporaryExcluded) {
    ineligibleReasons.push('Temporarily excluded by DM')
  }
  if (input.settings.tierGatingEnabled && tier > unlockedTier) {
    ineligibleReasons.push('Later tier not yet unlocked')
  }
  if (input.currentSessionId) {
    const currentSession = input.sessions.find((session) => session.id === input.currentSessionId)
    const alreadyAdvancedThisSession = currentSession?.powerAdvancements.some(
      (advancement) => advancement.powerId === input.power.id,
    )
    if (
      alreadyAdvancedThisSession &&
      input.settings.sameSessionDuplicateRequiresOverride &&
      !input.overrideDuplicate
    ) {
      ineligibleReasons.push('Same power already advanced during this session')
    }
  }
  if (
    input.progress.state === 'manifested' &&
    !input.overrideCooldown &&
    advancementsSincePower(input.sessions, input.power.id, input.progress.lastAdvancedAt) <
      input.settings.cooldownAdvancements
  ) {
    ineligibleReasons.push('Manifested power is still on cooldown')
  }

  if (ineligibleReasons.length === 0) {
    reasons.push(
      input.progress.state === 'locked'
        ? 'Locked ordinary power can manifest'
        : 'Manifested ordinary power can become fully realized',
    )
  }
  return { eligible: ineligibleReasons.length === 0, reasons, ineligibleReasons }
}

export function buildDrawCandidates(input: {
  settings: CampaignSettings
  progress: PowerProgress[]
  sessions: SessionRecord[]
  catchUpCredits: CatchUpCredit[]
  currentSessionId?: string
  overrideCooldown?: boolean
  overrideDuplicate?: boolean
  now?: Date
}): DrawCandidate[] {
  const progressMap = progressById(input.progress)
  const report = calculateScheduleReport({
    settings: input.settings,
    progress: input.progress,
    sessions: input.sessions,
    catchUpCredits: input.catchUpCredits,
    now: input.now,
  })
  return powerDefinitions.map((power) => {
    const progress = progressMap.get(power.id)
    if (!progress) throw new Error(`Missing progress record for ${power.id}`)
    const eligibility = explainPowerEligibility({
      power,
      progress,
      settings: input.settings,
      sessions: input.sessions,
      currentSessionId: input.currentSessionId,
      overrideCooldown: input.overrideCooldown,
      overrideDuplicate: input.overrideDuplicate,
      now: input.now,
    })
    let weight = 0
    if (eligibility.eligible) {
      const base = progress.relativeWeightOverride ?? 1
      const stateWeight = progress.state === 'locked' ? 1.25 : 1.1
      const unseenBonus = progress.appearanceCount === 0 ? 1.3 : 1
      const waitingBonus =
        1 +
        Math.min(
          1.5,
          advancementsSincePower(input.sessions, power.id, progress.lastAdvancedAt) * 0.18,
        )
      const behindBonus =
        report.status === 'critically-behind'
          ? 1.35
          : report.status === 'slightly-behind'
            ? 1.15
            : 1
      const tierDampener = power.tier >= 4 && report.campaignMonth < 8 ? 0.7 : 1
      weight = Number(
        (base * stateWeight * unseenBonus * waitingBonus * behindBonus * tierDampener).toFixed(4),
      )
    }
    return {
      power,
      progress,
      eligible: eligibility.eligible,
      reasons: eligibility.reasons,
      ineligibleReasons: eligibility.ineligibleReasons,
      weight,
      lastAdvancedAt: progress.lastAdvancedAt,
    }
  })
}

export function drawWeightedCandidate(
  candidates: DrawCandidate[],
  provider: RandomProvider = secureRandomProvider,
): DrawCandidate {
  const eligible = candidates.filter((candidate) => candidate.eligible && candidate.weight > 0)
  if (eligible.length === 0) {
    const allCooldown = candidates.some((candidate) =>
      candidate.ineligibleReasons.includes('Manifested power is still on cooldown'),
    )
    throw new Error(
      allCooldown
        ? 'No eligible powers are available because all candidates are blocked or on cooldown.'
        : 'No eligible powers are available under the current locks and milestone rules.',
    )
  }
  const total = eligible.reduce((sum, candidate) => sum + candidate.weight, 0)
  let ticket = provider.next() * total
  for (const candidate of eligible) {
    ticket -= candidate.weight
    if (ticket <= 0) return candidate
  }
  return eligible.at(-1) as DrawCandidate
}

export function performDraw(input: {
  settings: CampaignSettings
  progress: PowerProgress[]
  sessions: SessionRecord[]
  catchUpCredits: CatchUpCredit[]
  sessionId: string
  kind: DrawResult['kind']
  provider?: RandomProvider
  overrideCooldown?: boolean
  overrideDuplicate?: boolean
  now?: Date
}): DrawResult {
  const candidates = buildDrawCandidates({
    settings: input.settings,
    progress: input.progress,
    sessions: input.sessions,
    catchUpCredits: input.catchUpCredits,
    currentSessionId: input.sessionId,
    overrideCooldown: input.overrideCooldown,
    overrideDuplicate: input.overrideDuplicate,
    now: input.now,
  })
  const selected = drawWeightedCandidate(candidates, input.provider)
  const schedule = calculateScheduleReport({
    settings: input.settings,
    progress: input.progress,
    sessions: input.sessions,
    catchUpCredits: input.catchUpCredits,
    now: input.now,
  })
  return {
    id: makeId('draw'),
    sessionId: input.sessionId,
    kind: input.kind,
    selectedPowerId: selected.power.id,
    candidateCount: candidates.filter((candidate) => candidate.eligible).length,
    candidateSnapshot: candidates.map((candidate) => ({
      powerId: candidate.power.id,
      weight: candidate.weight,
      eligible: candidate.eligible,
    })),
    previousState: selected.progress.state,
    newState: nextPowerState(selected.progress.state),
    eligibilityReason: selected.reasons.join('; '),
    cooldownCreated: selected.progress.state === 'locked',
    scheduleProtectionActive:
      schedule.status === 'slightly-behind' || schedule.status === 'critically-behind',
    timestamp: nowIso(),
    status: 'previewed',
  }
}

export function ordinaryRandomPool(progress: PowerProgress[]): string[] {
  const progressMap = progressById(progress)
  return ordinaryPowerDefinitions
    .filter((power) => progressMap.get(power.id)?.state !== 'fully-realized')
    .map((power) => power.id)
}

export function powerCanEverBeRandom(power: PowerDefinition): boolean {
  return power.isRandomlySelectable && !power.isMilestoneControlled
}

export function stagePressure(progress: PowerProgress): number {
  return 2 - stateToStage(progress.state)
}
