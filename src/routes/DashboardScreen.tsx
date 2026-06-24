import { Link } from 'react-router-dom'
import { livingAnswerDefinition, powerDefinitions } from '../data/powers'
import { stateToStage } from '../domain/progression'
import { PageHeader, Panel, StatCard, stateLabel } from '../components/common'
import { getLatestAttendedSession, summarizePowerCounts, useAppState } from '../state/AppState'

export function DashboardScreen() {
  const { data, schedule, convergence, livingReport } = useAppState()
  const counts = summarizePowerCounts(data.powerProgress)
  const latestSession = getLatestAttendedSession(data.sessions)
  const lockedOrdinary = data.powerProgress.filter((progress) => progress.state === 'locked').length
  const totalStages = data.powerProgress.reduce(
    (sum, progress) => sum + stateToStage(progress.state),
    0,
  )
  const recent = data.auditEvents.slice(0, 6)

  return (
    <div className="dashboard-grid">
      <PageHeader
        title="Dashboard"
        description="Campaign pacing, current power state, catch-up pressure, and final unlock status."
        actions={
          <>
            <Link className="button button-secondary" to="/sessions">
              Start or Log Session
            </Link>
            <Link className="button button-primary" to="/draw">
              Draw Advancement
            </Link>
          </>
        }
      />
      <section className="stats-grid wide">
        <StatCard
          label="Campaign Month"
          value={schedule?.campaignMonth ?? 1}
          detail="Real-world schedule"
        />
        <StatCard
          label="Days Remaining"
          value={schedule?.daysRemaining ?? 0}
          detail="To target date"
        />
        <StatCard label="Sessions Attended" value={schedule?.attendedSessions ?? 0} />
        <StatCard label="Sessions Missed" value={schedule?.missedSessions ?? 0} tone="warning" />
        <StatCard label="Advancement Stages" value={totalStages} detail="Completed" tone="gold" />
        <StatCard label="Stages Remaining" value={schedule?.totalStagesRemaining ?? 0} />
        <StatCard label="Locked Powers" value={lockedOrdinary} />
        <StatCard label="Manifested" value={counts.manifested} tone="warning" />
        <StatCard label="Fully Realized" value={counts.fullyRealized} tone="good" />
        <StatCard label="Monthly Target" value={schedule?.currentMonthlyTarget ?? 0} />
        <StatCard
          label="Schedule"
          value={schedule ? stateLabel(schedule.status) : 'On Schedule'}
          detail={
            schedule?.differenceFromTarget
              ? `${schedule.differenceFromTarget} vs target`
              : 'No drift'
          }
          tone={
            schedule?.status === 'critically-behind'
              ? 'danger'
              : schedule?.status === 'slightly-behind'
                ? 'warning'
                : 'good'
          }
        />
        <StatCard
          label="Catch-Up Credits"
          value={schedule?.catchUpCreditsRemaining ?? 0}
          detail="Remaining owed stages"
          tone={schedule?.catchUpCreditsRemaining ? 'warning' : 'neutral'}
        />
      </section>
      <Panel className="primary-panel">
        <h2>Next Recommended Action</h2>
        <p>{schedule?.nextRecommendation ?? 'Create a campaign session to begin tracking.'}</p>
        <div className="action-row">
          <Link className="button button-primary" to="/draw">
            Draw Advancement
          </Link>
          <Link className="button button-secondary" to="/catch-up">
            Review Catch-Up
          </Link>
        </div>
      </Panel>
      <Panel>
        <h2>Convergence Engine</h2>
        <p>{convergence?.explanation}</p>
        <div className="progress-bar" aria-label="Convergence Engine progress">
          <span style={{ width: `${((convergence?.completedMilestones ?? 0) / 3) * 100}%` }} />
        </div>
        <p>
          {convergence?.completedMilestones ?? 0} of 3 milestones complete;{' '}
          {convergence?.fullyRealizedOrdinaryPowers ?? 0} ordinary powers fully realized.
        </p>
      </Panel>
      <Panel>
        <h2>{livingAnswerDefinition.name}</h2>
        <p>The Living Answer: {stateLabel(livingReport?.status ?? 'sealed')}</p>
        <p>{livingAnswerDefinition.unlockRequirement}</p>
        <p className="muted">{livingReport?.manaBatteryNotice}</p>
      </Panel>
      <Panel className="tree-preview">
        <h2>Skill Tree Preview</h2>
        <img src="/assets/dumare-skill-tree.jpg" alt="Uploaded Dumare skill-tree reference" />
        <Link to="/tree" className="button button-secondary">
          Open Interactive Tree
        </Link>
      </Panel>
      <Panel>
        <h2>Recent Activity</h2>
        {recent.length ? (
          <ol className="activity-list">
            {recent.map((event) => (
              <li key={event.id}>
                <strong>{stateLabel(event.type)}</strong>
                <span>{event.reason}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>No advancement history exists.</p>
        )}
      </Panel>
      <Panel>
        <h2>Active Session</h2>
        {latestSession ? (
          <p>
            Session {latestSession.sessionNumber}: {latestSession.title || 'Untitled session'} on{' '}
            {latestSession.date}
          </p>
        ) : (
          <p>No attended session has been logged yet.</p>
        )}
        <p>{powerDefinitions.length} DOCX-derived powers are loaded.</p>
      </Panel>
    </div>
  )
}
