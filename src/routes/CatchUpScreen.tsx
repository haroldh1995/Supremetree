import { useState } from 'react'
import {
  Button,
  ErrorMessage,
  Field,
  PageHeader,
  Panel,
  TextInput,
  stateLabel,
} from '../components/common'
import { reverseCatchUpCreditUse, useCatchUpCredit } from '../domain/catchup'
import type { CatchUpCredit } from '../domain/types'
import { useAppState } from '../state/AppState'

export function CatchUpScreen() {
  const { data, actions } = useAppState()
  const [error, setError] = useState<string | null>(null)
  const [stages, setStages] = useState(1)
  const [reason, setReason] = useState('DM-granted catch-up credit')

  async function updateCredit(
    credit: CatchUpCredit,
    patch: Partial<CatchUpCredit>,
    actionReason: string,
  ) {
    try {
      await actions.updateCatchUpCredit({ ...credit, ...patch }, actionReason)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credit update failed.')
    }
  }

  async function grant() {
    if (!data.settings) return
    try {
      await actions.grantCatchUpCredit({ settings: data.settings, stages, reason })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credit grant failed.')
    }
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Catch-Up Credits"
        description="Credits are explicit records and never hidden inside schedule math."
      />
      <ErrorMessage message={error} />
      <Panel>
        <h2>Grant Credit</h2>
        <div className="form-grid">
          <Field label="Stages owed">
            <TextInput
              type="number"
              min={1}
              value={stages}
              onChange={(event) => setStages(Number(event.target.value))}
            />
          </Field>
          <Field label="Reason">
            <TextInput value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
        </div>
        <Button variant="primary" onClick={() => void grant()}>
          Grant Catch-Up Credit
        </Button>
      </Panel>
      <div className="record-list">
        {data.catchUpCredits.map((credit) => (
          <Panel key={credit.id}>
            <h2>{credit.reason}</h2>
            <dl className="summary-list">
              <dt>Status</dt>
              <dd>{stateLabel(credit.status)}</dd>
              <dt>Month</dt>
              <dd>{credit.campaignMonth}</dd>
              <dt>Owed</dt>
              <dd>{credit.stagesOwed}</dd>
              <dt>Used</dt>
              <dd>{credit.used}</dd>
              <dt>Remaining</dt>
              <dd>{credit.remaining}</dd>
            </dl>
            <div className="action-row">
              <Button
                variant="secondary"
                onClick={() =>
                  void updateCredit(credit, { status: 'approved' }, 'Credit approved by DM.')
                }
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  void updateCredit(credit, { status: 'rejected' }, 'Credit rejected by DM.')
                }
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void updateCredit(credit, { status: 'deferred' }, 'Credit deferred.')
                }
              >
                Defer
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void updateCredit(
                    credit,
                    { status: 'converted-to-milestone' },
                    'Credit converted into a narrative milestone.',
                  )
                }
              >
                Convert to Milestone
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void updateCredit(
                    useCatchUpCredit(credit, 1),
                    {},
                    'Credit partially used outside a draw.',
                  )
                }
              >
                Use One
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  void updateCredit(
                    reverseCatchUpCreditUse(credit, 1),
                    {},
                    'Accidental credit use reversed.',
                  )
                }
              >
                Reverse Use
              </Button>
            </div>
          </Panel>
        ))}
        {data.catchUpCredits.length === 0 ? <Panel>No catch-up credits exist.</Panel> : null}
      </div>
    </div>
  )
}
