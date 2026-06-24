import { convergenceDefinition } from '../data/powers'
import { PageHeader, Panel, StatCard, stateLabel } from '../components/common'
import { useAppState } from '../state/AppState'

export function ConvergenceScreen() {
  const { convergence } = useAppState()
  return (
    <div className="screen-stack">
      <PageHeader
        title="Convergence Engine"
        description="Milestone-controlled synchronization based on other fully realized powers."
      />
      <Panel>
        <h2>{convergenceDefinition?.name}</h2>
        <p>{convergenceDefinition?.fullDescription}</p>
        <p className="muted">{convergence?.explanation}</p>
        <div className="stats-grid">
          <StatCard
            label="Status"
            value={stateLabel(convergence?.status ?? 'dormant')}
            tone="gold"
          />
          <StatCard
            label="Fully Realized Ordinary Powers"
            value={convergence?.fullyRealizedOrdinaryPowers ?? 0}
          />
          <StatCard
            label="Milestones Complete"
            value={`${convergence?.completedMilestones ?? 0} / 3`}
          />
        </div>
      </Panel>
      <div className="record-list">
        {convergence?.milestones.map((milestone) => (
          <Panel key={milestone.id}>
            <h2>{milestone.label}</h2>
            <p>
              Requires {milestone.requiredFullyRealizedPowers} ordinary power(s) fully realized.
            </p>
            <p>{milestone.complete ? 'Complete' : 'Incomplete'}</p>
          </Panel>
        ))}
      </div>
    </div>
  )
}
