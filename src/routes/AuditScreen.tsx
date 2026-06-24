import { useState } from 'react'
import {
  Button,
  ErrorMessage,
  Field,
  PageHeader,
  Panel,
  SelectInput,
  stateLabel,
} from '../components/common'
import { useAppState } from '../state/AppState'

export function AuditScreen() {
  const { data, actions } = useAppState()
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const events = data.auditEvents.filter((event) => filter === 'all' || event.type === filter)
  const types = Array.from(new Set(data.auditEvents.map((event) => event.type))).sort()

  async function undo() {
    try {
      await actions.undoMostRecent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Undo failed.')
    }
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Audit History"
        description="Append-only event history. Undo creates a compensating event instead of deleting records."
        actions={
          <Button variant="secondary" onClick={() => void undo()}>
            Undo Recent Reversible Event
          </Button>
        }
      />
      <ErrorMessage message={error} />
      <Panel>
        <Field label="Event type">
          <SelectInput value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All events</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {stateLabel(type)}
              </option>
            ))}
          </SelectInput>
        </Field>
      </Panel>
      <ol className="audit-list">
        {events.map((event) => (
          <li key={event.id}>
            <Panel>
              <h2>{stateLabel(event.type)}</h2>
              <p>{event.reason}</p>
              <dl className="summary-list">
                <dt>Timestamp</dt>
                <dd>{new Date(event.timestamp).toLocaleString()}</dd>
                <dt>Source</dt>
                <dd>{stateLabel(event.source)}</dd>
                <dt>Reversible</dt>
                <dd>{event.reversible ? 'Yes' : 'No'}</dd>
              </dl>
            </Panel>
          </li>
        ))}
      </ol>
    </div>
  )
}
