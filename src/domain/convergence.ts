import { ordinaryPowerDefinitions } from '../data/powers'
import { stateToStage } from './progression'
import type { MilestoneRequirement, PowerProgress } from './types'

export interface ConvergenceMilestone {
  id: string
  label: string
  requiredFullyRealizedPowers: number
  complete: boolean
}

export interface ConvergenceReport {
  fullyRealizedOrdinaryPowers: number
  ordinaryPowerCount: number
  milestones: ConvergenceMilestone[]
  completedMilestones: number
  stagesRemaining: number
  status: 'dormant' | 'initial-sync' | 'active-sync' | 'complete'
  explanation: string
}

export function buildConvergenceMilestones(
  ordinaryPowerCount = ordinaryPowerDefinitions.length,
): ConvergenceMilestone[] {
  return [
    {
      id: 'convergence-initial',
      label: 'Initial synchronization',
      requiredFullyRealizedPowers: Math.max(1, Math.ceil(ordinaryPowerCount * 0.25)),
      complete: false,
    },
    {
      id: 'convergence-combat-style',
      label: 'Combat style integration',
      requiredFullyRealizedPowers: Math.max(1, Math.ceil(ordinaryPowerCount * 0.6)),
      complete: false,
    },
    {
      id: 'convergence-final',
      label: 'Final synchronization',
      requiredFullyRealizedPowers: ordinaryPowerCount,
      complete: false,
    },
  ]
}

export function calculateConvergenceReport(progress: PowerProgress[]): ConvergenceReport {
  const ordinaryIds = new Set(ordinaryPowerDefinitions.map((power) => power.id))
  const fullyRealizedOrdinaryPowers = progress.filter(
    (item) => ordinaryIds.has(item.powerId) && item.state === 'fully-realized',
  ).length
  const milestones = buildConvergenceMilestones().map((milestone) => ({
    ...milestone,
    complete: fullyRealizedOrdinaryPowers >= milestone.requiredFullyRealizedPowers,
  }))
  const completedMilestones = milestones.filter((milestone) => milestone.complete).length
  const stagesRemaining = milestones.length - completedMilestones
  let status: ConvergenceReport['status'] = 'dormant'
  if (completedMilestones === 1) status = 'initial-sync'
  if (completedMilestones === 2) status = 'active-sync'
  if (completedMilestones === milestones.length) status = 'complete'

  return {
    fullyRealizedOrdinaryPowers,
    ordinaryPowerCount: ordinaryPowerDefinitions.length,
    milestones,
    completedMilestones,
    stagesRemaining,
    status,
    explanation:
      'Convergence Engine is milestone controlled here because the DOCX describes it as synchronizing already manifested powers rather than unlocking powers early.',
  }
}

export function convergenceRequirementsFromProgress(
  progress: PowerProgress[],
): MilestoneRequirement[] {
  return calculateConvergenceReport(progress).milestones.map((milestone) => ({
    id: milestone.id,
    label: milestone.label,
    description: `Requires ${milestone.requiredFullyRealizedPowers} ordinary power(s) fully realized.`,
    complete: milestone.complete,
    source: 'convergence',
  }))
}

export function convergenceIsComplete(progress: PowerProgress[]): boolean {
  return calculateConvergenceReport(progress).status === 'complete'
}

export function convergenceStageValue(progress: PowerProgress[]): number {
  return calculateConvergenceReport(progress).completedMilestones
}

export function convergencePowerState(
  progress: PowerProgress[],
): 'locked' | 'manifested' | 'fully-realized' {
  const completed = calculateConvergenceReport(progress).completedMilestones
  if (completed === 0) return 'locked'
  if (completed < 3) return 'manifested'
  return 'fully-realized'
}

export function convergenceCompletedByHistory(progress: PowerProgress[]): boolean {
  return stateToStage(convergencePowerState(progress)) === 2
}
