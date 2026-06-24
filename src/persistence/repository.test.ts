import { beforeEach, describe, expect, it } from 'vitest'
import { powerDefinitions } from '../data/powers'
import { performDraw, createSeededRandomProvider } from '../domain/randomizer'
import { db } from './db'
import {
  commitDraw,
  createCampaign,
  createSession,
  loadAppData,
  manualAdvancePower,
  undoMostRecent,
} from './repository'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('IndexedDB repository transactions', () => {
  it('creates manual override audit events and compensating undo events', async () => {
    await createCampaign({
      campaignName: 'Repo Test',
      startDate: '2026-01-01',
      targetDate: '2027-01-01',
    })
    const session = await createSession({ date: '2026-01-03', attended: true })
    await manualAdvancePower({
      powerId: powerDefinitions[0]!.id,
      sessionId: session.id,
      kind: 'normal',
      reason: 'Manual table ruling',
    })
    let data = await loadAppData()
    expect(data.auditEvents.some((event) => event.type === 'manual-advancement')).toBe(true)
    await undoMostRecent()
    data = await loadAppData()
    expect(data.auditEvents.some((event) => event.type === 'undo-performed')).toBe(true)
  })

  it('does not partially commit an advancement when the session is missing', async () => {
    await createCampaign({
      campaignName: 'Rollback Test',
      startDate: '2026-01-01',
      targetDate: '2027-01-01',
    })
    const data = await loadAppData()
    const draw = performDraw({
      settings: data.settings!,
      progress: data.powerProgress,
      sessions: [],
      catchUpCredits: [],
      sessionId: 'missing-session',
      kind: 'normal',
      provider: createSeededRandomProvider(5),
    })
    await expect(commitDraw({ draw, reason: 'Should fail', narrative: {} })).rejects.toThrow(
      /session or progress is missing/i,
    )
    const after = await loadAppData()
    expect(after.drawHistory.length).toBe(0)
    expect(after.powerProgress.every((progress) => progress.state === 'locked')).toBe(true)
  })
})
