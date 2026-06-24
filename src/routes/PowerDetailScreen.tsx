import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPowerById, powerDefinitions } from '../data/powers'
import { buildDrawCandidates } from '../domain/randomizer'
import type { PowerProgress, PowerState } from '../domain/types'
import {
  Button,
  ErrorMessage,
  Field,
  PageHeader,
  Panel,
  TextArea,
  TextInput,
  formatDate,
  stateLabel,
} from '../components/common'
import { useAppState } from '../state/AppState'

export function PowerDetailScreen() {
  const { powerId = '' } = useParams()
  const { data, actions } = useAppState()
  const power = getPowerById(powerId)
  const progress = data.powerProgress.find((item) => item.powerId === powerId)
  const [error, setError] = useState<string | null>(null)
  const [dmNotes, setDmNotes] = useState(progress?.dmNotes ?? '')
  const [lockReason, setLockReason] = useState(progress?.lockReason ?? '')
  const [weight, setWeight] = useState(progress?.relativeWeightOverride?.toString() ?? '')
  const [tierOverride, setTierOverride] = useState(progress?.tierOverride?.toString() ?? '')
  const [backlashOutcome, setBacklashOutcome] = useState(progress?.backlashOutcome ?? '')
  const sessions = data.sessions.filter((session) =>
    session.powerAdvancements.some((advancement) => advancement.powerId === powerId),
  )
  const candidate = useMemo(() => {
    if (!data.settings || !progress) return undefined
    return buildDrawCandidates({
      settings: data.settings,
      progress: data.powerProgress,
      sessions: data.sessions,
      catchUpCredits: data.catchUpCredits,
    }).find((item) => item.power.id === powerId)
  }, [data.catchUpCredits, data.powerProgress, data.sessions, data.settings, powerId, progress])

  if (!power || !progress) {
    return (
      <Panel>
        <h1>Power not found</h1>
        <Link to="/powers">Return to Power Library</Link>
      </Panel>
    )
  }
  const activePower = power
  const activeProgress = progress

  async function saveProgress(next: PowerProgress, reason: string) {
    try {
      setError(null)
      await actions.updatePowerProgress(next, reason)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Power update failed.')
    }
  }

  async function setState(state: PowerState) {
    const reason = window.prompt('Reason for manual state change')
    if (!reason) return
    await actions.overridePowerState(activePower.id, state, reason)
  }

  async function saveDmControls() {
    const reason = window.prompt('Reason for DM control update')
    if (!reason) return
    const next: PowerProgress = {
      ...activeProgress,
      dmNotes,
      lockReason: lockReason || undefined,
      relativeWeightOverride: weight ? Number(weight) : undefined,
      tierOverride: tierOverride ? Number(tierOverride) : undefined,
    }
    await saveProgress(next, reason)
  }

  async function updateBacklash(status: PowerProgress['backlashStatus']) {
    const reason = window.prompt('Backlash update reason')
    if (!reason) return
    await saveProgress(
      { ...activeProgress, backlashStatus: status, backlashOutcome: backlashOutcome || undefined },
      reason,
    )
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title={activePower.name}
        description={`#${activePower.displayNumber} - ${activePower.category} - ${stateLabel(activeProgress.state)}`}
        actions={
          <Link className="button button-secondary" to="/powers">
            Back to Library
          </Link>
        }
      />
      <ErrorMessage message={error} />
      <div className="two-column">
        <Panel>
          <h2>Canonical Information</h2>
          <p>{power.fullDescription}</p>
          {power.dmExample ? (
            <>
              <h3>DM Example</h3>
              <p>{power.dmExample}</p>
            </>
          ) : null}
          <h3>First Manifestation Backlash</h3>
          <p>
            {power.firstRollBacklash ||
              'No first-roll backlash text is supplied in the uploaded DOCX.'}
          </p>
          <h3>Weaknesses and Hard Counters</h3>
          <ul>
            {[...power.weaknesses, ...power.hardCounters].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Convergence Relationships</h3>
          <p>
            {power.convergenceSynergies
              .map((id) => powerDefinitions.find((related) => related.id === id)?.name)
              .filter(Boolean)
              .join(', ') || 'No related powers supplied.'}
          </p>
        </Panel>
        <Panel>
          <h2>Campaign State</h2>
          <dl className="summary-list">
            <dt>State</dt>
            <dd>{stateLabel(progress.state)}</dd>
            <dt>Manifestation count</dt>
            <dd>{progress.manifestationCount}</dd>
            <dt>Appearances</dt>
            <dd>{progress.appearanceCount}</dd>
            <dt>Last advancement</dt>
            <dd>{formatDate(progress.lastAdvancedAt)}</dd>
            <dt>Eligibility</dt>
            <dd>{candidate?.eligible ? 'Eligible' : 'Ineligible'}</dd>
            <dt>Random weight</dt>
            <dd>{candidate?.weight ?? 0}</dd>
          </dl>
          <p className="muted">
            {candidate?.eligible
              ? candidate.reasons.join(', ')
              : candidate?.ineligibleReasons.join(', ') || 'No eligibility reason available.'}
          </p>
          <div className="action-row">
            <Button variant="secondary" onClick={() => void setState('locked')}>
              Set Locked
            </Button>
            <Button variant="secondary" onClick={() => void setState('manifested')}>
              Set Manifested
            </Button>
            <Button variant="secondary" onClick={() => void setState('fully-realized')}>
              Set Fully Realized
            </Button>
          </div>
        </Panel>
      </div>
      <Panel>
        <h2>Backlash Record</h2>
        <Field label="Recorded outcome">
          <TextArea
            value={backlashOutcome}
            onChange={(event) => setBacklashOutcome(event.target.value)}
          />
        </Field>
        <div className="action-row">
          {(['triggered', 'resolved', 'modified', 'skipped', 'custom'] as const).map((status) => (
            <Button key={status} variant="secondary" onClick={() => void updateBacklash(status)}>
              Mark {stateLabel(status)}
            </Button>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2>Manual DM Controls</h2>
        <div className="form-grid">
          <Field label="Tier override">
            <TextInput
              type="number"
              min={1}
              max={5}
              value={tierOverride}
              onChange={(event) => setTierOverride(event.target.value)}
            />
          </Field>
          <Field label="Relative weight override">
            <TextInput
              type="number"
              step="0.1"
              min={0}
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </Field>
          <Field label="Lock reason">
            <TextInput value={lockReason} onChange={(event) => setLockReason(event.target.value)} />
          </Field>
        </div>
        <Field label="DM notes">
          <TextArea value={dmNotes} onChange={(event) => setDmNotes(event.target.value)} />
        </Field>
        <div className="check-row">
          <label>
            <input
              type="checkbox"
              checked={progress.narrativeLocked}
              onChange={(event) =>
                void saveProgress(
                  { ...progress, narrativeLocked: event.target.checked },
                  'Narrative lock changed.',
                )
              }
            />
            Narrative lock
          </label>
          <label>
            <input
              type="checkbox"
              checked={progress.temporaryExcluded}
              onChange={(event) =>
                void saveProgress(
                  { ...progress, temporaryExcluded: event.target.checked },
                  'Temporary exclusion changed.',
                )
              }
            />
            Temporary exclusion
          </label>
          <label>
            <input
              type="checkbox"
              checked={progress.randomSelectionAllowed}
              onChange={(event) =>
                void saveProgress(
                  { ...progress, randomSelectionAllowed: event.target.checked },
                  'Random-selection permission changed.',
                )
              }
            />
            Random selectable
          </label>
        </div>
        <Button variant="primary" onClick={() => void saveDmControls()}>
          Save DM Controls
        </Button>
      </Panel>
      <Panel>
        <h2>Advancement Timeline</h2>
        {sessions.length ? (
          <ol className="activity-list">
            {sessions.map((session) => (
              <li key={session.id}>
                <strong>Session {session.sessionNumber}</strong>
                <span>{session.date}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>This power has not advanced in any session.</p>
        )}
      </Panel>
    </div>
  )
}
