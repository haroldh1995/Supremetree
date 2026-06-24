import type { ManifestationHistoryEntry } from '../domain/types'

type HistoryPanelProps = {
  history: ManifestationHistoryEntry[]
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  const latest = [...history].reverse()

  return (
    <details className="historyPanel">
      <summary>
        Manifestation History <span>{history.length}</span>
      </summary>
      {history.length === 0 ? (
        <p>No manifestations recorded.</p>
      ) : (
        <ol>
          {latest.map((entry) => (
            <li key={entry.id}>
              <span>#{entry.sequence}</span>
              <strong>{entry.powerName}</strong>
              <em>{entry.kind}</em>
              <time dateTime={entry.manifestedAt}>{formatDateTime(entry.manifestedAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </details>
  )
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
