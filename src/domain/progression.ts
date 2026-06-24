import { powerDefinitions } from '../data/powers'
import { makeId, nowIso } from './ids'
import type {
  AdvancementNarrative,
  AdvancementRecord,
  AuditSource,
  DrawKind,
  PowerDefinition,
  PowerProgress,
  PowerState,
} from './types'

export function createInitialPowerProgress(definitions = powerDefinitions): PowerProgress[] {
  return definitions.map((power) => ({
    powerId: power.id,
    state: 'locked',
    manifestationCount: 0,
    appearanceCount: 0,
    advancedSessionIds: [],
    narrativeLocked: false,
    temporaryExcluded: false,
    randomSelectionAllowed: power.isRandomlySelectable,
    backlashStatus: 'not-triggered',
  }))
}

export function stateToStage(state: PowerState): number {
  if (state === 'manifested') return 1
  if (state === 'fully-realized') return 2
  return 0
}

export function nextPowerState(state: PowerState): PowerState {
  if (state === 'locked') return 'manifested'
  if (state === 'manifested') return 'fully-realized'
  throw new Error('Fully realized powers cannot be advanced again.')
}

export function canAdvancePower(progress: PowerProgress): boolean {
  return progress.state !== 'fully-realized'
}

export interface AdvancePowerInput {
  definition: PowerDefinition
  progress: PowerProgress
  sessionId: string
  kind: DrawKind
  source: AuditSource
  reason: string
  timestamp?: string
  narrative?: AdvancementNarrative
}

export interface AdvancePowerOutput {
  progress: PowerProgress
  advancement: AdvancementRecord
  previousState: PowerState
  newState: PowerState
}

export function advancePower(input: AdvancePowerInput): AdvancePowerOutput {
  if (!canAdvancePower(input.progress)) {
    throw new Error(`${input.definition.name} is already fully realized.`)
  }

  const timestamp = input.timestamp ?? nowIso()
  const previousState = input.progress.state
  const newState = nextPowerState(previousState)
  const firstManifestation = previousState === 'locked' && newState === 'manifested'
  const advancement: AdvancementRecord = {
    id: makeId('adv'),
    powerId: input.definition.id,
    previousState,
    newState,
    sessionId: input.sessionId,
    kind: input.kind,
    source: input.source,
    timestamp,
    reason: input.reason,
    narrative: input.narrative ?? {},
    firstRollBacklash: firstManifestation ? input.definition.firstRollBacklash : undefined,
  }

  const progress: PowerProgress = {
    ...input.progress,
    state: newState,
    manifestationCount: input.progress.manifestationCount + (firstManifestation ? 1 : 0),
    appearanceCount: input.progress.appearanceCount + 1,
    lastAdvancedAt: timestamp,
    advancedSessionIds: [...input.progress.advancedSessionIds, input.sessionId],
    backlashStatus:
      firstManifestation && input.definition.firstRollBacklash
        ? 'triggered'
        : input.progress.backlashStatus,
  }

  return { progress, advancement, previousState, newState }
}

export function reverseAdvancement(
  progress: PowerProgress,
  advancement: AdvancementRecord,
): PowerProgress {
  const advancedSessionIds = progress.advancedSessionIds.filter(
    (id) => id !== advancement.sessionId,
  )
  return {
    ...progress,
    state: advancement.previousState,
    manifestationCount:
      advancement.previousState === 'locked' && advancement.newState === 'manifested'
        ? Math.max(0, progress.manifestationCount - 1)
        : progress.manifestationCount,
    appearanceCount: Math.max(0, progress.appearanceCount - 1),
    lastAdvancedAt: undefined,
    advancedSessionIds,
  }
}

export function setPowerState(
  progress: PowerProgress,
  state: PowerState,
  reason: string,
): PowerProgress {
  const stage = stateToStage(state)
  return {
    ...progress,
    state,
    manifestationCount: stage > 0 ? Math.max(progress.manifestationCount, 1) : 0,
    appearanceCount: Math.max(progress.appearanceCount, stage),
    dmNotes: [progress.dmNotes, reason].filter(Boolean).join('\n'),
  }
}

export function countCompletedStages(progress: PowerProgress[]): number {
  return progress.reduce((total, item) => total + stateToStage(item.state), 0)
}

export function countRemainingStages(
  progress: PowerProgress[],
  definitions = powerDefinitions,
): number {
  const requiredIds = new Set(
    definitions.filter((power) => power.isRequiredForLivingAnswer).map((p) => p.id),
  )
  return progress
    .filter((item) => requiredIds.has(item.powerId))
    .reduce((total, item) => total + Math.max(0, 2 - stateToStage(item.state)), 0)
}
