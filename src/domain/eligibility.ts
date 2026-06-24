import type {
  AppProgress,
  EligibleCandidate,
  IneligibleReason,
  PowerDefinition,
  PowerProgress,
} from './types'

export function getProgressForPower(progress: AppProgress, power: PowerDefinition): PowerProgress {
  const powerProgress = progress.powers[power.id]
  if (!powerProgress) {
    throw new Error(`Missing progress for ${power.name}`)
  }
  return powerProgress
}

export function getBaseEligibleCandidates(
  powers: PowerDefinition[],
  progress: AppProgress,
): EligibleCandidate[] {
  return powers.flatMap((power) => {
    const powerProgress = getProgressForPower(progress, power)
    if (!power.selectable) {
      return []
    }
    if (power.milestoneControlled) {
      return []
    }
    if (powerProgress.state === 'fully_manifested') {
      return []
    }
    return [
      {
        power,
        progress: powerProgress,
        reason:
          powerProgress.state === 'unmanifested'
            ? 'Unmanifested powers are eligible for a first manifestation.'
            : 'First Manifestation powers remain eligible for full manifestation.',
      },
    ]
  })
}

export function getEligibleCandidates(
  powers: PowerDefinition[],
  progress: AppProgress,
): EligibleCandidate[] {
  const base = getBaseEligibleCandidates(powers, progress)
  const blockedPowerId = progress.cooldown.blockedPowerId

  if (!blockedPowerId || base.length <= 1) {
    return base
  }

  const withoutCooldown = base.filter((candidate) => candidate.power.id !== blockedPowerId)
  return withoutCooldown.length > 0 ? withoutCooldown : base
}

export function getIneligibleReasons(
  powers: PowerDefinition[],
  progress: AppProgress,
): IneligibleReason[] {
  const base = getBaseEligibleCandidates(powers, progress)
  const baseIds = new Set(base.map((candidate) => candidate.power.id))
  const eligibleIds = new Set(
    getEligibleCandidates(powers, progress).map((candidate) => candidate.power.id),
  )

  return powers
    .filter((power) => !eligibleIds.has(power.id))
    .map((power) => {
      const powerProgress = getProgressForPower(progress, power)
      if (powerProgress.state === 'fully_manifested') {
        return { powerId: power.id, reason: 'Already fully manifested.' }
      }
      if (!power.selectable) {
        return { powerId: power.id, reason: 'Not part of the random manifestation pool.' }
      }
      if (power.milestoneControlled) {
        return { powerId: power.id, reason: 'Milestone controlled by canonical rules.' }
      }
      if (baseIds.has(power.id) && !eligibleIds.has(power.id)) {
        return {
          powerId: power.id,
          reason:
            'Light anti-repetition cooldown: this power manifested on the previous accepted result.',
        }
      }
      return { powerId: power.id, reason: 'Blocked by current progression rules.' }
    })
}

export function updateCooldownAfterCommit(
  progress: AppProgress,
  committedPowerId: string,
  nextState: string,
): AppProgress {
  if (nextState === 'first_manifestation') {
    return {
      ...progress,
      cooldown: { blockedPowerId: committedPowerId },
    }
  }

  if (progress.cooldown.blockedPowerId && progress.cooldown.blockedPowerId !== committedPowerId) {
    return {
      ...progress,
      cooldown: {},
    }
  }

  if (nextState === 'fully_manifested') {
    return {
      ...progress,
      cooldown: {},
    }
  }

  return progress
}
