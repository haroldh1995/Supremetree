import { livingAnswerDefinition, ordinaryPowerDefinitions } from '../data/powers'
import { convergenceIsComplete } from './convergence'
import type { LivingAnswerRecord, MilestoneRequirement, PowerProgress } from './types'

export interface LivingAnswerRequirement {
  id: string
  label: string
  complete: boolean
  detail: string
}

export interface LivingAnswerReport {
  status: LivingAnswerRecord['status']
  mechanicallyAvailable: boolean
  requirements: LivingAnswerRequirement[]
  manaBatteryNotice: string
}

export function createInitialLivingAnswer(): LivingAnswerRecord {
  return {
    id: 'the-living-answer',
    status: 'sealed',
    manaBatteryEmergencyOnly: true,
    manaBatteryFullActivation: 'inactive',
  }
}

export function calculateLivingAnswerReport(input: {
  progress: PowerProgress[]
  narrativeRequirements: MilestoneRequirement[]
  livingAnswer: LivingAnswerRecord
}): LivingAnswerReport {
  const ordinaryIds = new Set(ordinaryPowerDefinitions.map((power) => power.id))
  const fullyRealizedOrdinary = input.progress.filter(
    (item) => ordinaryIds.has(item.powerId) && item.state === 'fully-realized',
  ).length
  const allOrdinaryComplete = fullyRealizedOrdinary === ordinaryPowerDefinitions.length
  const convergenceComplete = convergenceIsComplete(input.progress)
  const livingRequirements = input.narrativeRequirements.filter(
    (requirement) => requirement.source === 'living-answer',
  )
  const narrativeComplete = livingRequirements.every((requirement) => requirement.complete)
  const mechanicallyAvailable = allOrdinaryComplete && convergenceComplete && narrativeComplete

  const derivedStatus =
    input.livingAnswer.status === 'sealed' && !mechanicallyAvailable
      ? 'requirements-in-progress'
      : input.livingAnswer.status
  const status =
    mechanicallyAvailable && derivedStatus === 'requirements-in-progress'
      ? 'mechanically-available'
      : derivedStatus

  return {
    status,
    mechanicallyAvailable,
    requirements: [
      {
        id: 'all-ordinary-fully-realized',
        label: 'Ordinary powers fully realized',
        complete: allOrdinaryComplete,
        detail: `${fullyRealizedOrdinary} of ${ordinaryPowerDefinitions.length} ordinary powers fully realized.`,
      },
      {
        id: 'convergence-complete',
        label: 'Convergence Engine complete',
        complete: convergenceComplete,
        detail: convergenceComplete
          ? 'Convergence Engine final synchronization is complete.'
          : 'Convergence Engine still needs ordinary powers fully realized.',
      },
      ...livingRequirements.map((requirement) => ({
        id: requirement.id,
        label: requirement.label,
        complete: requirement.complete,
        detail: requirement.description,
      })),
      {
        id: 'dm-narrative-reveal',
        label: 'DM narrative reveal',
        complete:
          input.livingAnswer.status === 'narratively-revealed' ||
          input.livingAnswer.status === 'fully-active',
        detail:
          'The DM must explicitly confirm the reveal; calendar timing alone never unlocks it.',
      },
    ],
    manaBatteryNotice:
      'The mana battery full function remains an emergency-only mechanism and is tracked separately from The Living Answer.',
  }
}

export function defaultLivingAnswerRequirements(): MilestoneRequirement[] {
  return [
    {
      id: 'living-dm-approval',
      label: 'DM approval',
      description:
        'The DM confirms the table is ready for the final narrative reveal after mechanical requirements are met.',
      complete: false,
      source: 'living-answer',
    },
    {
      id: 'living-final-sign',
      label: 'Final sign revealed',
      description: livingAnswerDefinition.unlockRequirement,
      complete: false,
      source: 'living-answer',
    },
  ]
}
