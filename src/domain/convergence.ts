import type { AppProgress, ConvergenceStatus, PowerDefinition } from './types'

export function calculateConvergenceStatus(
  powers: PowerDefinition[],
  progress: AppProgress,
): ConvergenceStatus {
  const convergence = powers.find((power) => power.id === 'convergence-engine')
  if (!convergence) {
    throw new Error('Convergence Engine is missing from canonical data')
  }

  const convergenceProgress = progress.powers[convergence.id]
  if (!convergenceProgress) {
    throw new Error('Convergence Engine progress is missing')
  }

  const syncablePowers = powers.filter((power) => power.id !== convergence.id)
  const synchronizedFullyManifested = syncablePowers.filter(
    (power) => progress.powers[power.id]?.state === 'fully_manifested',
  ).length
  const synchronizationTotal = syncablePowers.length
  const synchronizationRatio =
    synchronizationTotal === 0 ? 0 : synchronizedFullyManifested / synchronizationTotal

  const label =
    convergenceProgress.state === 'fully_manifested'
      ? 'Fully Manifested'
      : convergenceProgress.state === 'first_manifestation'
        ? 'First Manifestation'
        : 'Dormant'

  return {
    powerState: convergenceProgress.state,
    synchronizedFullyManifested,
    synchronizationTotal,
    synchronizationRatio,
    label,
  }
}
