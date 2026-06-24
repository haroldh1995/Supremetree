import type {
  AppProgress,
  LivingAnswerProgress,
  ManifestationHistoryEntry,
  PendingManifestation,
  PowerDefinition,
  PowerProgress,
  PowerState,
  UserPreferences,
} from './types'

export const defaultPreferences: UserPreferences = {
  reducedMotion: false,
}

export function createInitialPowerProgress(
  powers: PowerDefinition[],
): Record<string, PowerProgress> {
  return Object.fromEntries(
    powers.map((power) => [
      power.id,
      {
        powerId: power.id,
        state: 'unmanifested' satisfies PowerState,
        selectionCount: 0,
      },
    ]),
  )
}

export function createInitialProgress(powers: PowerDefinition[]): AppProgress {
  return {
    powers: createInitialPowerProgress(powers),
    history: [],
    cooldown: {},
    livingAnswer: createInitialLivingAnswerProgress(),
    preferences: defaultPreferences,
  }
}

export function createInitialLivingAnswerProgress(): LivingAnswerProgress {
  return { state: 'locked' }
}

export function getNextPowerState(current: PowerState): Exclude<PowerState, 'unmanifested'> {
  if (current === 'unmanifested') {
    return 'first_manifestation'
  }
  if (current === 'first_manifestation') {
    return 'fully_manifested'
  }
  throw new Error('A fully manifested power cannot advance again')
}

export function getManifestationKind(nextState: Exclude<PowerState, 'unmanifested'>) {
  return nextState === 'first_manifestation' ? 'First Manifestation' : 'Full Manifestation'
}

export function createPendingManifestation(
  power: PowerDefinition,
  progress: PowerProgress,
  sequence: number,
  selectedAt: string,
): PendingManifestation {
  const nextState = getNextPowerState(progress.state)

  return {
    id: `pending-${selectedAt}-${power.id}`,
    powerId: power.id,
    previousState: progress.state,
    nextState,
    kind: getManifestationKind(nextState),
    selectedAt,
    sequence,
  }
}

export function commitPendingManifestation(
  appProgress: AppProgress,
  power: PowerDefinition,
  pending: PendingManifestation,
): AppProgress {
  const current = appProgress.powers[power.id]
  if (!current) {
    throw new Error(`Cannot commit unknown power ${power.id}`)
  }
  if (current.state !== pending.previousState) {
    throw new Error(`Cannot commit ${power.name}; stored state changed before acknowledgment`)
  }
  if (current.state === 'fully_manifested') {
    throw new Error(`${power.name} is already fully manifested`)
  }

  const updatedPower: PowerProgress = {
    ...current,
    state: pending.nextState,
    selectionCount: current.selectionCount + 1,
    firstManifestedAt:
      pending.nextState === 'first_manifestation' ? pending.selectedAt : current.firstManifestedAt,
    fullyManifestedAt:
      pending.nextState === 'fully_manifested' ? pending.selectedAt : current.fullyManifestedAt,
  }

  const historyEntry: ManifestationHistoryEntry = {
    id: `history-${pending.sequence}-${pending.powerId}`,
    sequence: pending.sequence,
    powerId: power.id,
    powerName: power.name,
    kind: pending.kind,
    manifestedAt: pending.selectedAt,
  }

  return {
    ...appProgress,
    powers: {
      ...appProgress.powers,
      [power.id]: updatedPower,
    },
    history: [...appProgress.history, historyEntry],
    pendingManifestation: undefined,
  }
}

export function resetProgress(
  powers: PowerDefinition[],
  preferences = defaultPreferences,
): AppProgress {
  return {
    ...createInitialProgress(powers),
    preferences,
  }
}
