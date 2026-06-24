import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  ErrorMessage,
  Field,
  PageHeader,
  Panel,
  TextArea,
  TextInput,
  formatDate,
} from '../components/common'
import { todayIso } from '../domain/ids'
import { useAppState } from '../state/AppState'

export function SessionsScreen() {
  const { data, actions } = useAppState()
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState(todayIso())
  const [attended, setAttended] = useState(true)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [majorSession, setMajorSession] = useState(false)
  const [bossEncounter, setBossEncounter] = useState(false)
  const [divineMilestone, setDivineMilestone] = useState(false)
  const [dmNotes, setDmNotes] = useState('')

  async function submit() {
    try {
      setError(null)
      await actions.createSession({
        date,
        attended,
        title: title || undefined,
        summary: summary || undefined,
        majorSession,
        bossEncounter,
        divineMilestone,
        dmNotes: dmNotes || undefined,
      })
      setTitle('')
      setSummary('')
      setDmNotes('')
      setMajorSession(false)
      setBossEncounter(false)
      setDivineMilestone(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session could not be saved.')
    }
  }

  async function markAttendance(sessionId: string, nextAttended: boolean) {
    try {
      await actions.updateSession(
        sessionId,
        { attended: nextAttended },
        'Corrected session attendance.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attendance update failed.')
    }
  }

  async function removeSession(sessionId: string) {
    const reason = window.prompt('Reason for deleting this mistaken session')
    if (!reason) return
    if (!window.confirm('Delete this session record? This creates an audit event.')) return
    try {
      await actions.deleteSession(sessionId, reason)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session deletion failed.')
    }
  }

  async function undo() {
    try {
      await actions.undoMostRecent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No reversible action is available.')
    }
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Session Tracker"
        description="Record attended and missed sessions without silently granting in-story power."
        actions={
          <Button variant="ghost" onClick={() => void undo()}>
            Undo Recent Action
          </Button>
        }
      />
      <ErrorMessage message={error} />
      <Panel>
        <h2>Create Session</h2>
        <div className="form-grid">
          <Field label="Session date">
            <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Attendance">
            <select
              className="input"
              value={attended ? 'attended' : 'missed'}
              onChange={(event) => setAttended(event.target.value === 'attended')}
            >
              <option value="attended">Attended</option>
              <option value="missed">Missed</option>
            </select>
          </Field>
          <Field label="Session title">
            <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="DM notes">
            <TextInput value={dmNotes} onChange={(event) => setDmNotes(event.target.value)} />
          </Field>
        </div>
        <Field label="Summary">
          <TextArea value={summary} onChange={(event) => setSummary(event.target.value)} />
        </Field>
        <div className="check-row">
          <label>
            <input
              type="checkbox"
              checked={majorSession}
              onChange={(event) => setMajorSession(event.target.checked)}
            />
            Major session
          </label>
          <label>
            <input
              type="checkbox"
              checked={bossEncounter}
              onChange={(event) => setBossEncounter(event.target.checked)}
            />
            Boss encounter
          </label>
          <label>
            <input
              type="checkbox"
              checked={divineMilestone}
              onChange={(event) => setDivineMilestone(event.target.checked)}
            />
            Divine or lore milestone
          </label>
        </div>
        <Button variant="primary" onClick={() => void submit()}>
          Save Session
        </Button>
      </Panel>
      <Panel>
        <h2>Session Ledger</h2>
        <div className="record-list">
          {data.sessions.map((session) => (
            <article className="record-card" key={session.id}>
              <div>
                <h3>
                  Session {session.sessionNumber}: {session.title || 'Untitled'}
                </h3>
                <p>
                  {formatDate(session.date)} - {session.attended ? 'Attended' : 'Missed'}
                </p>
                {session.summary ? <p>{session.summary}</p> : null}
                <p>
                  Advancements: {session.powerAdvancements.length} | Normal{' '}
                  {session.normalAdvancements} | Bonus {session.bonusAdvancements} | Catch-up{' '}
                  {session.catchUpAdvancements}
                </p>
              </div>
              <div className="record-actions">
                <Button
                  variant="secondary"
                  onClick={() => void markAttendance(session.id, !session.attended)}
                >
                  Mark {session.attended ? 'Missed' : 'Attended'}
                </Button>
                <Link className="button button-secondary" to="/draw">
                  Add Advancement Later
                </Link>
                <Button variant="danger" onClick={() => void removeSession(session.id)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
          {data.sessions.length === 0 ? <p>No sessions recorded.</p> : null}
        </div>
      </Panel>
    </div>
  )
}
