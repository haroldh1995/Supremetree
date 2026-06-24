import { describe, expect, it } from 'vitest'
import { CANONICAL_DATA_HASH, powers } from '../data/powers'
import { loadAutosave, saveAutosave } from './autosave'
import { validateCanonicalData } from './canonicalValidation'
import { calculateConvergenceStatus } from './convergence'
import { getEligibleCandidates, updateCooldownAfterCommit } from './eligibility'
import { calculateLivingAnswerStatus, syncLivingAnswerAvailability } from './livingAnswer'
import {
  commitPendingManifestation,
  createInitialProgress,
  createPendingManifestation,
  getNextPowerState,
  resetProgress,
} from './progression'
import { createDeterministicRandom, selectRandomCandidate } from './random'
import { createSavePayload, parseSaveFile, validateSavePayload } from './save'
import { progressWithOnlyEligible, progressWithStates } from '../test/factories'

describe('canonical data', () => {
  it('validates the DOCX-derived canonical dataset', () => {
    expect(validateCanonicalData(powers)).toEqual([])
  })
})

describe('eligibility and progression', () => {
  it('only eligible powers enter the random pool', () => {
    const progress = createInitialProgress(powers)
    progress.powers['petrifying-gaze']!.state = 'fully_manifested'
    progress.powers['petrifying-gaze']!.selectionCount = 2

    const candidates = getEligibleCandidates(powers, progress)

    expect(candidates.map((candidate) => candidate.power.id)).not.toContain('petrifying-gaze')
    expect(candidates.map((candidate) => candidate.power.id)).not.toContain('living-answer')
    expect(candidates).toHaveLength(19)
  })

  it('excludes milestone-only powers when applicable', () => {
    const progress = createInitialProgress(powers)
    const fixture = [{ ...powers[0]!, milestoneControlled: true, selectable: false }]

    expect(getEligibleCandidates(fixture, progress)).toEqual([])
  })

  it('advances from unmanifested to First Manifestation and then Fully Manifested', () => {
    const progress = createInitialProgress(powers)
    const power = powers[0]!
    const first = createPendingManifestation(
      power,
      progress.powers[power.id]!,
      1,
      '2026-06-24T12:00:00.000Z',
    )

    const afterFirst = commitPendingManifestation(progress, power, first)
    expect(afterFirst.powers[power.id]?.state).toBe('first_manifestation')
    expect(afterFirst.history[0]?.kind).toBe('First Manifestation')

    const second = createPendingManifestation(
      power,
      afterFirst.powers[power.id]!,
      2,
      '2026-06-24T13:00:00.000Z',
    )
    const afterSecond = commitPendingManifestation(afterFirst, power, second)

    expect(afterSecond.powers[power.id]?.state).toBe('fully_manifested')
    expect(afterSecond.history[1]?.kind).toBe('Full Manifestation')
    expect(
      getEligibleCandidates(powers, afterSecond).map((candidate) => candidate.power.id),
    ).not.toContain(power.id)
  })

  it('prevents a third selection after full manifestation', () => {
    expect(() => getNextPowerState('fully_manifested')).toThrow('cannot advance')
  })

  it('applies and clears the light anti-repetition cooldown', () => {
    const progress = createInitialProgress(powers)
    const blocked = updateCooldownAfterCommit(progress, 'petrifying-gaze', 'first_manifestation')
    const candidates = getEligibleCandidates(powers, blocked).map((candidate) => candidate.power.id)

    expect(candidates).not.toContain('petrifying-gaze')

    const afterDifferentPower = updateCooldownAfterCommit(
      blocked,
      'wingless-flight',
      'first_manifestation',
    )

    expect(
      getEligibleCandidates(powers, afterDifferentPower).map((candidate) => candidate.power.id),
    ).toContain('petrifying-gaze')
    expect(
      getEligibleCandidates(powers, afterDifferentPower).map((candidate) => candidate.power.id),
    ).not.toContain('wingless-flight')
  })

  it('allows the cooldown power if it is the only eligible candidate', () => {
    const progress = progressWithOnlyEligible('petrifying-gaze', 'first_manifestation')
    progress.cooldown.blockedPowerId = 'petrifying-gaze'

    expect(getEligibleCandidates(powers, progress).map((candidate) => candidate.power.id)).toEqual([
      'petrifying-gaze',
    ])
  })

  it('selects random candidates with an injectable deterministic source', () => {
    const progress = createInitialProgress(powers)
    const candidate = selectRandomCandidate(
      getEligibleCandidates(powers, progress),
      createDeterministicRandom([3]),
    )

    expect(candidate.power.id).toBe('grand-denial')
  })
})

describe('Convergence Engine and The Living Answer', () => {
  it('updates Convergence Engine synchronization from fully manifested powers', () => {
    const progress = progressWithStates({
      'petrifying-gaze': 'fully_manifested',
      'wingless-flight': 'fully_manifested',
      'convergence-engine': 'first_manifestation',
    })

    const status = calculateConvergenceStatus(powers, progress)

    expect(status.powerState).toBe('first_manifestation')
    expect(status.synchronizedFullyManifested).toBe(2)
    expect(status.synchronizationTotal).toBe(19)
  })

  it('makes The Living Answer mechanically available only after all D20 powers are complete', () => {
    const progress = progressWithStates(
      Object.fromEntries(powers.map((power) => [power.id, 'fully_manifested'])),
    )
    const synced = syncLivingAnswerAvailability(powers, progress)
    const status = calculateLivingAnswerStatus(powers, synced)

    expect(status.mechanicallyAvailable).toBe(true)
    expect(status.state).toBe('available')
    expect(status.requirementText).toContain('all 20 powers')
  })
})

describe('save, reset, and autosave', () => {
  it('exports and imports a complete valid save payload', () => {
    const progress = progressWithStates({ 'petrifying-gaze': 'first_manifestation' })
    const payload = createSavePayload(progress, '2026-06-24T12:00:00.000Z')

    expect(payload.canonicalDataHash).toBe(CANONICAL_DATA_HASH)
    expect(parseSaveFile(JSON.stringify(payload)).progress.powers['petrifying-gaze']?.state).toBe(
      'first_manifestation',
    )
  })

  it('rejects invalid saves', () => {
    expect(() => parseSaveFile('{')).toThrow('not valid JSON')
    expect(() => validateSavePayload({ schemaVersion: 1, canonicalDataHash: 'wrong' })).toThrow(
      'different canonical',
    )
  })

  it('clears state on reset', () => {
    const reset = resetProgress(powers)

    expect(Object.values(reset.powers).every((power) => power.state === 'unmanifested')).toBe(true)
    expect(reset.history).toEqual([])
    expect(reset.cooldown).toEqual({})
    expect(reset.livingAnswer.state).toBe('locked')
  })

  it('restores browser autosave including pending results', () => {
    const storage = window.localStorage
    storage.clear()
    const progress = createInitialProgress(powers)
    progress.pendingManifestation = createPendingManifestation(
      powers[0]!,
      progress.powers[powers[0]!.id]!,
      1,
      '2026-06-24T12:00:00.000Z',
    )

    saveAutosave(progress, storage)

    expect(loadAutosave(storage)?.pendingManifestation?.powerId).toBe(powers[0]!.id)
  })
})
