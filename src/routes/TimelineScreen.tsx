import { PageHeader, Panel, StatCard, stateLabel } from '../components/common'
import { calculateMonthlyCheckpoint } from '../domain/schedule'
import { useAppState } from '../state/AppState'

export function TimelineScreen() {
  const { data } = useAppState()
  const checkpoints =
    data.settings && data.powerProgress.length
      ? Array.from({ length: data.settings.defaultDurationMonths }, (_, index) =>
          calculateMonthlyCheckpoint({
            settings: data.settings!,
            progress: data.powerProgress,
            sessions: data.sessions,
            catchUpCredits: data.catchUpCredits,
            month: index + 1,
          }),
        )
      : []
  return (
    <div className="screen-stack">
      <PageHeader
        title="Campaign Timeline"
        description="Monthly checkpoints recalculate from remaining stages and expected attended sessions."
      />
      <section className="timeline-grid">
        {checkpoints.map((checkpoint) => (
          <Panel key={checkpoint.month}>
            <h2>Month {checkpoint.month}</h2>
            <div className="stats-grid compact">
              <StatCard label="Expected" value={checkpoint.expectedAdvancementTotal} />
              <StatCard label="Actual" value={checkpoint.actualAdvancementTotal} />
              <StatCard label="Difference" value={checkpoint.difference} />
              <StatCard label="Missed Effect" value={checkpoint.missedSessionEffect} />
            </div>
            <p>{checkpoint.message}</p>
            <p>
              Recommended next rate: {checkpoint.recommendedRateNextMonth.toFixed(2)} stage(s) per
              expected attended session.
            </p>
            <p>
              {checkpoint.doubleAdvancementRecommended
                ? 'Double-advancement session recommended.'
                : 'Single advancement pace is sufficient.'}
            </p>
          </Panel>
        ))}
      </section>
      <Panel>
        <h2>Session History</h2>
        <ol className="activity-list">
          {data.sessions.map((session) => (
            <li key={session.id}>
              <strong>
                Session {session.sessionNumber}: {session.attended ? 'Attended' : 'Missed'}
              </strong>
              <span>
                {session.date} -{' '}
                {session.powerAdvancements
                  .map((advancement) => stateLabel(advancement.newState))
                  .join(', ') || 'No advancement'}
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}
