import { livingAnswer } from '../data/powers'
import type { AppProgress, LivingAnswerStatus, PowerDefinition } from './types'

export function calculateLivingAnswerStatus(
  powers: PowerDefinition[],
  progress: AppProgress,
): LivingAnswerStatus {
  const required = powers.filter((power) => power.requiredForLivingAnswer)
  const requiredPowersComplete = required.filter(
    (power) => progress.powers[power.id]?.state === 'fully_manifested',
  ).length
  const requiredPowersTotal = required.length
  const mechanicallyAvailable = requiredPowersComplete === requiredPowersTotal

  return {
    state: progress.livingAnswer.state,
    mechanicallyAvailable,
    requiredPowersComplete,
    requiredPowersTotal,
    requirementText: livingAnswer.unlockRequirement,
  }
}

export function syncLivingAnswerAvailability(
  powers: PowerDefinition[],
  progress: AppProgress,
): AppProgress {
  const status = calculateLivingAnswerStatus(powers, progress)
  if (progress.livingAnswer.state === 'revealed') {
    return progress
  }
  return {
    ...progress,
    livingAnswer: {
      ...progress.livingAnswer,
      state: status.mechanicallyAvailable ? 'available' : 'locked',
      revealedAt: status.mechanicallyAvailable ? progress.livingAnswer.revealedAt : undefined,
    },
  }
}

export function revealLivingAnswer(progress: AppProgress, revealedAt: string): AppProgress {
  return {
    ...progress,
    livingAnswer: {
      state: 'revealed',
      revealedAt,
    },
  }
}
