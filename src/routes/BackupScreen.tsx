import { useState } from 'react'
import { Button, ErrorMessage, PageHeader, Panel } from '../components/common'
import { timestampedBackupFilename, validateBackupPayload } from '../domain/backup'
import type { BackupPayload } from '../domain/types'
import { useAppState } from '../state/AppState'

export function BackupScreen() {
  const { actions } = useAppState()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<BackupPayload | null>(null)

  async function exportJson() {
    try {
      const payload = await actions.exportBackup()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = timestampedBackupFilename(new Date(payload.exportedAt))
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.')
    }
  }

  async function readFile(file: File) {
    try {
      const text = await file.text()
      const payload = validateBackupPayload(JSON.parse(text))
      setPreview(payload)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup file is invalid.')
      setPreview(null)
    }
  }

  async function importPreview() {
    if (!preview) return
    if (!window.confirm('Import this backup and overwrite current local campaign data?')) return
    try {
      await actions.importBackup(preview)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  async function reset() {
    const reason = window.prompt('Reason for resetting the campaign')
    if (!reason) return
    if (!window.confirm('Reset the local campaign database? Export a backup first if needed.'))
      return
    await actions.resetCampaign(reason)
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Backup and Restore"
        description="Export complete local data, validate imports, and reset safely."
      />
      <ErrorMessage message={error} />
      <Panel>
        <h2>Export</h2>
        <p>
          Exports campaign settings, progression, sessions, draw history, credits, requirements, UI
          preferences, and audit events.
        </p>
        <Button variant="primary" onClick={() => void exportJson()}>
          Export Campaign Backup
        </Button>
      </Panel>
      <Panel>
        <h2>Import</h2>
        <input
          className="input"
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void readFile(file)
          }}
        />
        {preview ? (
          <div className="callout">
            <p>Backup exported {preview.exportedAt}</p>
            <p>
              Campaigns {preview.campaigns.length}, sessions {preview.sessions.length}, audit events{' '}
              {preview.auditEvents.length}
            </p>
            <Button variant="primary" onClick={() => void importPreview()}>
              Confirm Import
            </Button>
          </div>
        ) : null}
      </Panel>
      <Panel>
        <h2>Reset Campaign</h2>
        <p>
          Reset clears the local IndexedDB campaign. It does not claim cloud backup or remote
          recovery.
        </p>
        <Button variant="danger" onClick={() => void reset()}>
          Reset Campaign
        </Button>
      </Panel>
    </div>
  )
}
