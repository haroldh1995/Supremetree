import { useMemo, useState } from 'react'
import { getPowerById, powerDefinitions } from '../data/powers'
import { buildDrawCandidates, createSeededRandomProvider } from '../domain/randomizer'
import type { AdvancementNarrative, DrawKind, DrawResult } from '../domain/types'
import {
  Button,
  ErrorMessage,
  Field,
  PageHeader,
  Panel,
  SelectInput,
  TextArea,
  TextInput,
  stateLabel,
} from '../components/common'
import { todayIso } from '../domain/ids'
import { useAppState } from '../state/AppState'

export function DrawScreen() {
  const { data, actions, schedule } = useAppState()
  const attendedSessions = data.sessions.filter((session) => session.attended)
  const [sessionId, setSessionId] = useState(attendedSessions.at(-1)?.id ?? '')
  const [kind, setKind] = useState<DrawKind>('normal')
  const [overrideCooldown, setOverrideCooldown] = useState(false)
  const [overrideDuplicate, setOverrideDuplicate] = useState(false)
  const [pendingDraw, setPendingDraw] = useState<DrawResult | null>(null)
  const [manualPowerId, setManualPowerId] = useState(powerDefinitions[0]?.id ?? '')
  const [rerollReason, setRerollReason] = useState('')
  const [commitReason, setCommitReason] = useState('Accepted table result.')
  const [triggeringEvent, setTriggeringEvent] = useState('')
  const [manifestationAppearance, setManifestationAppearance] = useState('')
  const [backlashOutcome, setBacklashOutcome] = useState('')
  const [consequences, setConsequences] = useState('')
  const [witnesses, setWitnesses] = useState('')
  const [notes, setNotes] = useState('')
  const [creditId, setCreditId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const candidates = useMemo(() => {
    if (!data.settings) return []
    return buildDrawCandidates({
      settings: data.settings,
      progress: data.powerProgress,
      sessions: data.sessions,
      catchUpCredits: data.catchUpCredits,
      currentSessionId: sessionId || undefined,
      overrideCooldown,
      overrideDuplicate,
    })
  }, [
    data.catchUpCredits,
    data.powerProgress,
    data.sessions,
    data.settings,
    overrideCooldown,
    overrideDuplicate,
    sessionId,
  ])
  const eligibleCount = candidates.filter((candidate) => candidate.eligible).length
  const selectedPower = pendingDraw ? getPowerById(pendingDraw.selectedPowerId) : undefined
  const approvedCredits = data.catchUpCredits.filter(
    (credit) =>
      credit.remaining > 0 &&
      credit.status !== 'rejected' &&
      credit.status !== 'deferred' &&
      (!credit.dmApprovalRequired || credit.status === 'approved'),
  )

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId
    const session = await actions.createSession({
      date: todayIso(),
      attended: true,
      title: 'Advancement session',
    })
    setSessionId(session.id)
    return session.id
  }

  function getProvider() {
    const seed = window.localStorage.getItem('dumareRandomSeed')
    return seed ? createSeededRandomProvider(Number(seed)) : undefined
  }

  async function draw() {
    try {
      setError(null)
      const activeSessionId = await ensureSession()
      setPendingDraw(
        actions.previewDraw({
          sessionId: activeSessionId,
          kind,
          overrideCooldown,
          overrideDuplicate,
          provider: getProvider(),
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draw failed.')
    }
  }

  function narrative(): AdvancementNarrative {
    return {
      triggeringEvent: triggeringEvent || undefined,
      manifestationAppearance: manifestationAppearance || undefined,
      backlashOutcome: backlashOutcome || undefined,
      consequences: consequences || undefined,
      witnesses: witnesses || undefined,
      notes: notes || undefined,
    }
  }

  async function commit() {
    if (!pendingDraw) return
    try {
      setError(null)
      await actions.commitDraw({
        draw: pendingDraw,
        reason: commitReason,
        narrative: narrative(),
        consumeCatchUpCreditId: kind === 'catch-up' ? creditId || undefined : undefined,
      })
      setPendingDraw(null)
      setTriggeringEvent('')
      setManifestationAppearance('')
      setBacklashOutcome('')
      setConsequences('')
      setWitnesses('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed.')
    }
  }

  async function reroll() {
    if (!pendingDraw || !rerollReason.trim()) {
      setError('A reroll requires a reason.')
      return
    }
    try {
      await actions.recordReroll(pendingDraw, rerollReason)
      setPendingDraw(null)
      await draw()
      setRerollReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reroll failed.')
    }
  }

  async function cancel() {
    if (!pendingDraw) return
    const reason = window.prompt('Reason for cancelling this draw')
    if (!reason) return
    await actions.recordDrawCancelled(pendingDraw, reason)
    setPendingDraw(null)
  }

  async function manualAdvance() {
    try {
      const reason = window.prompt('Manual advancement reason')
      if (!reason) return
      const activeSessionId = await ensureSession()
      await actions.manualAdvancePower({
        powerId: manualPowerId,
        sessionId: activeSessionId,
        kind: 'forced',
        reason,
        narrative: narrative(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Manual advancement failed.')
    }
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Advancement Draw"
        description="Preview, reveal, and commit random progress as one audited transaction."
      />
      <ErrorMessage message={error} />
      <div className="two-column">
        <Panel>
          <h2>Draw Setup</h2>
          <div className="form-grid">
            <Field label="Session">
              <SelectInput value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
                <option value="">Create attended session now</option>
                {attendedSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    Session {session.sessionNumber} - {session.date}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Draw type">
              <SelectInput
                value={kind}
                onChange={(event) => setKind(event.target.value as DrawKind)}
              >
                <option value="normal">Normal</option>
                <option value="catch-up">Catch-up</option>
                <option value="bonus">Bonus</option>
                <option value="forced">Forced</option>
              </SelectInput>
            </Field>
          </div>
          <div className="check-row">
            <label>
              <input
                type="checkbox"
                checked={overrideCooldown}
                onChange={(event) => setOverrideCooldown(event.target.checked)}
              />
              Override cooldown
            </label>
            <label>
              <input
                type="checkbox"
                checked={overrideDuplicate}
                onChange={(event) => setOverrideDuplicate(event.target.checked)}
              />
              Allow same-session duplicate
            </label>
          </div>
          <dl className="summary-list">
            <dt>Eligible powers</dt>
            <dd>{eligibleCount}</dd>
            <dt>Current session allowance</dt>
            <dd>{kind === 'normal' ? 'One normal advancement' : stateLabel(kind)}</dd>
            <dt>Schedule protection</dt>
            <dd>
              {schedule?.status === 'slightly-behind' || schedule?.status === 'critically-behind'
                ? 'Active'
                : 'Inactive'}
            </dd>
          </dl>
          <Button variant="primary" onClick={() => void draw()}>
            Draw and Reveal
          </Button>
        </Panel>
        <Panel aria-live="polite" className={pendingDraw ? 'reveal-panel active' : 'reveal-panel'}>
          <h2>Reveal</h2>
          {pendingDraw && selectedPower ? (
            <>
              <div className="draw-result">
                <span>#{selectedPower.displayNumber}</span>
                <strong>{selectedPower.name}</strong>
                <p>
                  {stateLabel(pendingDraw.previousState)} to {stateLabel(pendingDraw.newState)}
                </p>
              </div>
              <p>{selectedPower.shortSummary}</p>
              <p>Eligible because: {pendingDraw.eligibilityReason}</p>
              {pendingDraw.newState === 'manifested' ? (
                <p className="callout">
                  First-roll backlash:{' '}
                  {selectedPower.firstRollBacklash ||
                    'No first-roll backlash text is supplied in the uploaded DOCX.'}
                </p>
              ) : null}
              <Field label="Commit reason">
                <TextInput
                  value={commitReason}
                  onChange={(event) => setCommitReason(event.target.value)}
                />
              </Field>
              {kind === 'catch-up' ? (
                <Field label="Catch-up credit to use">
                  <SelectInput
                    value={creditId}
                    onChange={(event) => setCreditId(event.target.value)}
                  >
                    <option value="">No credit selected</option>
                    {approvedCredits.map((credit) => (
                      <option key={credit.id} value={credit.id}>
                        {credit.reason} - {credit.remaining} remaining
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ) : null}
              <NarrativeFields
                triggeringEvent={triggeringEvent}
                setTriggeringEvent={setTriggeringEvent}
                manifestationAppearance={manifestationAppearance}
                setManifestationAppearance={setManifestationAppearance}
                backlashOutcome={backlashOutcome}
                setBacklashOutcome={setBacklashOutcome}
                consequences={consequences}
                setConsequences={setConsequences}
                witnesses={witnesses}
                setWitnesses={setWitnesses}
                notes={notes}
                setNotes={setNotes}
              />
              <div className="action-row">
                <Button variant="primary" onClick={() => void commit()}>
                  Confirm and Commit
                </Button>
                <Field label="Reroll reason">
                  <TextInput
                    value={rerollReason}
                    onChange={(event) => setRerollReason(event.target.value)}
                  />
                </Field>
                <Button variant="secondary" onClick={() => void reroll()}>
                  Reroll
                </Button>
                <Button variant="ghost" onClick={() => void cancel()}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <p>No draw preview is active. Draw results are not committed until confirmed.</p>
          )}
        </Panel>
      </div>
      <Panel>
        <h2>Manual DM Selection</h2>
        <div className="form-grid">
          <Field label="Power">
            <SelectInput
              value={manualPowerId}
              onChange={(event) => setManualPowerId(event.target.value)}
            >
              {powerDefinitions.map((power) => (
                <option key={power.id} value={power.id}>
                  {power.displayNumber}. {power.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Button variant="secondary" onClick={() => void manualAdvance()}>
            Switch to Manual Selection
          </Button>
        </div>
      </Panel>
      <Panel>
        <h2>Candidate Explanation</h2>
        <div className="candidate-grid">
          {candidates.map((candidate) => (
            <article
              key={candidate.power.id}
              className={candidate.eligible ? 'candidate eligible' : 'candidate'}
            >
              <strong>{candidate.power.name}</strong>
              <span>Weight {candidate.weight}</span>
              <small>
                {candidate.eligible
                  ? candidate.reasons.join(', ')
                  : candidate.ineligibleReasons.join(', ')}
              </small>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function NarrativeFields(props: {
  triggeringEvent: string
  setTriggeringEvent(value: string): void
  manifestationAppearance: string
  setManifestationAppearance(value: string): void
  backlashOutcome: string
  setBacklashOutcome(value: string): void
  consequences: string
  setConsequences(value: string): void
  witnesses: string
  setWitnesses(value: string): void
  notes: string
  setNotes(value: string): void
}) {
  return (
    <div className="narrative-grid">
      <Field label="Triggering event">
        <TextArea
          value={props.triggeringEvent}
          onChange={(event) => props.setTriggeringEvent(event.target.value)}
        />
      </Field>
      <Field label="How it appeared">
        <TextArea
          value={props.manifestationAppearance}
          onChange={(event) => props.setManifestationAppearance(event.target.value)}
        />
      </Field>
      <Field label="Backlash outcome">
        <TextArea
          value={props.backlashOutcome}
          onChange={(event) => props.setBacklashOutcome(event.target.value)}
        />
      </Field>
      <Field label="Consequences">
        <TextArea
          value={props.consequences}
          onChange={(event) => props.setConsequences(event.target.value)}
        />
      </Field>
      <Field label="Witnesses">
        <TextInput
          value={props.witnesses}
          onChange={(event) => props.setWitnesses(event.target.value)}
        />
      </Field>
      <Field label="Additional notes">
        <TextInput value={props.notes} onChange={(event) => props.setNotes(event.target.value)} />
      </Field>
    </div>
  )
}
