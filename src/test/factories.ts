import { powers } from '../data/powers'
import { createInitialProgress } from '../domain/progression'
import type { AppProgress, PowerState } from '../domain/types'

export function progressWithStates(states: Record<string, PowerState>): AppProgress {
  const progress = createInitialProgress(powers)
  for (const [powerId, state] of Object.entries(states)) {
    const powerProgress = progress.powers[powerId]
    if (!powerProgress) {
      throw new Error(`Unknown test power id ${powerId}`)
    }
    powerProgress.state = state
    powerProgress.selectionCount =
      state === 'fully_manifested' ? 2 : state === 'first_manifestation' ? 1 : 0
    if (state === 'first_manifestation' || state === 'fully_manifested') {
      powerProgress.firstManifestedAt = '2026-06-24T12:00:00.000Z'
    }
    if (state === 'fully_manifested') {
      powerProgress.fullyManifestedAt = '2026-06-24T13:00:00.000Z'
    }
  }
  return progress
}

export function progressWithOnlyEligible(powerId: string, state: PowerState): AppProgress {
  const progress = createInitialProgress(powers)
  for (const power of powers) {
    const powerProgress = progress.powers[power.id]
    if (!powerProgress) {
      continue
    }
    powerProgress.state = 'fully_manifested'
    powerProgress.selectionCount = 2
    powerProgress.firstManifestedAt = '2026-06-24T12:00:00.000Z'
    powerProgress.fullyManifestedAt = '2026-06-24T13:00:00.000Z'
  }
  const target = progress.powers[powerId]
  if (!target) {
    throw new Error(`Unknown test power id ${powerId}`)
  }
  target.state = state
  target.selectionCount = state === 'first_manifestation' ? 1 : 0
  target.firstManifestedAt =
    state === 'first_manifestation' ? '2026-06-24T12:00:00.000Z' : undefined
  target.fullyManifestedAt = undefined
  return progress
}
