import { makeId, nowIso } from './ids'
import { getCampaignMonth } from './schedule'
import type { CampaignSettings, CatchUpCredit, SessionRecord } from './types'

export function createCatchUpCreditForMissedSession(input: {
  settings: CampaignSettings
  session: SessionRecord
  reason?: string
  stagesOwed?: number
}): CatchUpCredit {
  return {
    id: makeId('credit'),
    dateCreated: nowIso(),
    reason: input.reason ?? `Missed session ${input.session.sessionNumber}`,
    campaignMonth: getCampaignMonth(input.settings, new Date(`${input.session.date}T00:00:00`)),
    stagesOwed: input.stagesOwed ?? 1,
    used: 0,
    remaining: input.stagesOwed ?? 1,
    dmApprovalRequired: input.settings.catchUpRequiresApproval,
    status: input.settings.catchUpRequiresApproval ? 'pending' : 'approved',
    relatedMissedSessionIds: [input.session.id],
  }
}

export function useCatchUpCredit(credit: CatchUpCredit, stages: number): CatchUpCredit {
  if (credit.status === 'rejected') {
    throw new Error('Rejected catch-up credits cannot be used.')
  }
  if (credit.dmApprovalRequired && credit.status === 'pending') {
    throw new Error('This catch-up credit requires DM approval before use.')
  }
  const useAmount = Math.min(stages, credit.remaining)
  const remaining = credit.remaining - useAmount
  return {
    ...credit,
    used: credit.used + useAmount,
    remaining,
    status: remaining === 0 ? 'used' : credit.status === 'pending' ? 'approved' : credit.status,
  }
}

export function reverseCatchUpCreditUse(credit: CatchUpCredit, stages: number): CatchUpCredit {
  const restored = Math.min(credit.stagesOwed, credit.remaining + stages)
  return {
    ...credit,
    used: Math.max(0, credit.used - stages),
    remaining: restored,
    status: credit.status === 'used' ? 'approved' : credit.status,
  }
}
