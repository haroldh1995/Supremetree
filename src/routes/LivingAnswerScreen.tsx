import { useState } from 'react'
import { livingAnswerDefinition } from '../data/powers'
import { Button, ErrorMessage, PageHeader, Panel, stateLabel } from '../components/common'
import { useAppState } from '../state/AppState'

export function LivingAnswerScreen() {
  const { livingReport, data, actions } = useAppState()
  const [error, setError] = useState<string | null>(null)

  async function toggleRequirement(requirementId: string, complete: boolean) {
    const requirement = data.narrativeRequirements.find((item) => item.id === requirementId)
    if (!requirement) return
    try {
      await actions.updateRequirement(
        {
          ...requirement,
          complete,
          completedAt: complete ? new Date().toISOString() : undefined,
        },
        complete ? 'Requirement marked complete.' : 'Requirement reopened.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Requirement update failed.')
    }
  }

  async function reveal() {
    const reason = window.prompt('Narrative reveal reason')
    if (!reason) return
    try {
      await actions.revealLivingAnswer(reason)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reveal failed.')
    }
  }

  async function fullyActive() {
    const reason = window.prompt('Reason for marking The Living Answer fully active')
    if (!reason) return
    try {
      await actions.setLivingAnswerFullyActive(reason)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.')
    }
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="The Living Answer"
        description="Final unlock tracking with mechanical availability separated from narrative reveal."
      />
      <ErrorMessage message={error} />
      <Panel>
        <h2>{livingAnswerDefinition.name}</h2>
        <p>{livingAnswerDefinition.description}</p>
        <p className="callout">{livingAnswerDefinition.unlockRequirement}</p>
        <p>{livingReport?.manaBatteryNotice}</p>
        <p>Status: {stateLabel(livingReport?.status ?? 'sealed')}</p>
      </Panel>
      <Panel>
        <h2>Requirements</h2>
        <div className="record-list">
          {livingReport?.requirements.map((requirement) => (
            <article key={requirement.id} className="requirement-row">
              <div>
                <strong>{requirement.label}</strong>
                <p>{requirement.detail}</p>
              </div>
              <span className={requirement.complete ? 'status-pill status-ahead' : 'status-pill'}>
                {requirement.complete ? 'Complete' : 'Open'}
              </span>
              {data.narrativeRequirements.some((item) => item.id === requirement.id) ? (
                <Button
                  variant="secondary"
                  onClick={() => void toggleRequirement(requirement.id, !requirement.complete)}
                >
                  Mark {requirement.complete ? 'Open' : 'Complete'}
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2>DM Final Controls</h2>
        <div className="action-row">
          <Button variant="primary" onClick={() => void reveal()}>
            Confirm Narrative Reveal
          </Button>
          <Button variant="secondary" onClick={() => void fullyActive()}>
            Mark Fully Active
          </Button>
        </div>
        <p className="muted">
          The app never unlocks The Living Answer only because Month 12 arrives.
        </p>
      </Panel>
    </div>
  )
}
