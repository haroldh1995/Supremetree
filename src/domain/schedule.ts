import { ordinaryPowerDefinitions } from '../data/powers'
import { stateToStage } from './progression'
import type { CampaignSettings, CatchUpCredit, PowerProgress, SessionRecord } from './types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type ScheduleStatus = 'ahead' | 'on-schedule' | 'slightly-behind' | 'critically-behind'

export interface ScheduleReport {
  campaignMonth: number
  daysRemaining: number
  attendedSessions: number
  missedSessions: number
  totalAdvancementStagesCompleted: number
  ordinaryStagesCompleted: number
  ordinaryStagesRequired: number
  totalStagesRemaining: number
  expectedRemainingSessions: number
  recommendedStagesPerAttendedSession: number
  currentMonthlyTarget: number
  expectedAdvancementTotal: number
  differenceFromTarget: number
  status: ScheduleStatus
  catchUpCreditsRemaining: number
  nextRecommendation: string
  deadlineStillReachable: boolean
}

export interface MonthlyCheckpoint {
  month: number
  expectedAdvancementTotal: number
  actualAdvancementTotal: number
  difference: number
  missedSessionEffect: number
  catchUpCreditsOwed: number
  recommendedRateNextMonth: number
  doubleAdvancementRecommended: boolean
  deadlineStillReachable: boolean
  message: string
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY)
}

export function getCampaignMonth(settings: CampaignSettings, now = new Date()): number {
  const start = parseDateOnly(settings.startDate)
  if (now < start) return 1
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
  return Math.min(Math.max(months, 1), settings.defaultDurationMonths)
}

function expectedSessionsBetween(start: Date, end: Date, settings: CampaignSettings): number {
  if (end <= start) return 0
  const months = Math.max(0, daysBetween(start, end) / 30.437)
  return Math.max(0, Math.floor(months * settings.expectedSessionsPerMonth))
}

export function calculateScheduleReport(input: {
  settings: CampaignSettings
  progress: PowerProgress[]
  sessions: SessionRecord[]
  catchUpCredits: CatchUpCredit[]
  now?: Date
  convergenceStagesRemaining?: number
}): ScheduleReport {
  const now = input.now ?? new Date()
  const start = parseDateOnly(input.settings.startDate)
  const target = parseDateOnly(input.settings.targetDate)
  const ordinaryTarget = addMonths(start, input.settings.ordinaryCompletionMonth)
  const attendedSessions = input.sessions.filter((session) => session.attended).length
  const missedSessions = input.sessions.filter((session) => !session.attended).length
  const ordinaryIds = new Set(ordinaryPowerDefinitions.map((power) => power.id))
  const ordinaryProgress = input.progress.filter((item) => ordinaryIds.has(item.powerId))
  const ordinaryStagesCompleted = ordinaryProgress.reduce(
    (total, item) => total + stateToStage(item.state),
    0,
  )
  const ordinaryStagesRequired = ordinaryPowerDefinitions.length * 2
  const totalAdvancementStagesCompleted = input.progress.reduce(
    (total, item) => total + stateToStage(item.state),
    0,
  )
  const totalStagesRemaining =
    Math.max(0, ordinaryStagesRequired - ordinaryStagesCompleted) +
    Math.max(0, input.convergenceStagesRemaining ?? 0)
  const expectedRemainingSessions = expectedSessionsBetween(now, target, input.settings)
  const recommendedStagesPerAttendedSession =
    expectedRemainingSessions === 0
      ? totalStagesRemaining
      : totalStagesRemaining / expectedRemainingSessions

  const elapsedToOrdinaryTarget = Math.min(
    1,
    Math.max(
      0,
      (now.getTime() - start.getTime()) / Math.max(1, ordinaryTarget.getTime() - start.getTime()),
    ),
  )
  const expectedAdvancementTotal = Math.round(ordinaryStagesRequired * elapsedToOrdinaryTarget)
  const differenceFromTarget = ordinaryStagesCompleted - expectedAdvancementTotal
  const catchUpCreditsRemaining = input.catchUpCredits.reduce(
    (total, credit) =>
      credit.status !== 'rejected' && credit.status !== 'used' ? total + credit.remaining : total,
    0,
  )

  let status: ScheduleStatus = 'on-schedule'
  if (differenceFromTarget >= 2) status = 'ahead'
  if (differenceFromTarget <= -1) status = 'slightly-behind'
  if (differenceFromTarget <= -3 || recommendedStagesPerAttendedSession > 1.5) {
    status = 'critically-behind'
  }

  const deadlineStillReachable =
    expectedRemainingSessions === 0
      ? totalStagesRemaining === 0
      : recommendedStagesPerAttendedSession <= 2

  let nextRecommendation =
    'You are on schedule. One advancement per attended session is sufficient.'
  if (status === 'ahead') {
    nextRecommendation = `You are ${Math.abs(differenceFromTarget)} stages ahead of schedule.`
  } else if (status === 'slightly-behind') {
    nextRecommendation = 'One bonus advancement is recommended this month.'
  } else if (status === 'critically-behind') {
    nextRecommendation =
      catchUpCreditsRemaining > 0
        ? `${catchUpCreditsRemaining} catch-up advancement(s) should be applied during the next attended session.`
        : 'At the present attendance rate, additional milestone advancements are required to reach the target date.'
  }

  return {
    campaignMonth: getCampaignMonth(input.settings, now),
    daysRemaining: Math.max(0, daysBetween(now, target)),
    attendedSessions,
    missedSessions,
    totalAdvancementStagesCompleted,
    ordinaryStagesCompleted,
    ordinaryStagesRequired,
    totalStagesRemaining,
    expectedRemainingSessions,
    recommendedStagesPerAttendedSession,
    currentMonthlyTarget: Math.ceil(
      Math.max(0, ordinaryStagesRequired - ordinaryStagesCompleted) /
        Math.max(
          1,
          input.settings.ordinaryCompletionMonth - getCampaignMonth(input.settings, now) + 1,
        ),
    ),
    expectedAdvancementTotal,
    differenceFromTarget,
    status,
    catchUpCreditsRemaining,
    nextRecommendation,
    deadlineStillReachable,
  }
}

export function calculateMonthlyCheckpoint(input: {
  settings: CampaignSettings
  progress: PowerProgress[]
  sessions: SessionRecord[]
  catchUpCredits: CatchUpCredit[]
  month: number
  now?: Date
}): MonthlyCheckpoint {
  const report = calculateScheduleReport(input)
  const missedSessionEffect = input.sessions.filter((session) => !session.attended).length
  const catchUpCreditsOwed = Math.max(0, -report.differenceFromTarget)
  const recommendedRateNextMonth =
    report.expectedRemainingSessions === 0
      ? report.totalStagesRemaining
      : report.totalStagesRemaining / report.expectedRemainingSessions
  const doubleAdvancementRecommended = recommendedRateNextMonth > 1
  return {
    month: input.month,
    expectedAdvancementTotal: report.expectedAdvancementTotal,
    actualAdvancementTotal: report.ordinaryStagesCompleted,
    difference: report.differenceFromTarget,
    missedSessionEffect,
    catchUpCreditsOwed,
    recommendedRateNextMonth,
    doubleAdvancementRecommended,
    deadlineStillReachable: report.deadlineStillReachable,
    message: report.nextRecommendation,
  }
}
