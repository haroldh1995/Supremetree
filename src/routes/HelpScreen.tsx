import { PageHeader, Panel } from '../components/common'

const sections = [
  {
    title: 'Power States',
    body: 'Locked powers have not appeared. Manifested powers have appeared once. Fully Realized powers have appeared a second time and are removed from future random draws.',
  },
  {
    title: 'Random Selection',
    body: 'The draw system builds an eligible candidate list, excludes fully realized and milestone-only powers, applies cooldown and same-session rules, then draws from a weighted bag using crypto randomness in production.',
  },
  {
    title: 'Weighting',
    body: 'Never-manifested powers gain weight over time, manifested powers waiting for realization gain weight, and behind-schedule campaigns receive gentle schedule-protection pressure without making the next result predictable.',
  },
  {
    title: 'Cooldowns',
    body: 'After first manifestation, a power normally waits until at least two other advancements occur before it can be selected again. The DM can override this and the audit log records the override.',
  },
  {
    title: 'Missed Sessions',
    body: 'A missed session is recorded honestly. The app does not pretend Dumare participated and does not grant an in-story advancement silently.',
  },
  {
    title: 'Catch-Up Credits',
    body: 'Catch-up credits are stored records with owed, used, and remaining stages. They can be approved, rejected, deferred, converted to a milestone, partially used, or reversed.',
  },
  {
    title: 'Monthly Targets',
    body: 'Monthly targets recalculate from remaining required stages divided by expected remaining attended sessions. Four stages per month is a default pace, not a forced rule.',
  },
  {
    title: 'Convergence Engine',
    body: 'Convergence Engine is not randomly rolled. It progresses from ordinary powers becoming fully realized and represents synchronization of already manifested powers.',
  },
  {
    title: 'The Living Answer',
    body: 'The Living Answer is never randomly rolled. It becomes mechanically available only after tracked prerequisites are complete, and the DM must explicitly confirm the narrative reveal.',
  },
  {
    title: 'Mana Battery',
    body: 'The mana battery full function remains emergency-only and separate. Revealing The Living Answer does not automatically activate the battery.',
  },
  {
    title: 'Manual DM Overrides',
    body: 'Manual controls require a reason and create audit events. Undo creates a compensating event rather than deleting the original record.',
  },
  {
    title: 'Audit Integrity',
    body: 'Campaign changes are written to IndexedDB with append-only audit records so progression decisions remain visible and reversible where safe.',
  },
]

export function HelpScreen() {
  return (
    <div className="screen-stack">
      <PageHeader
        title="Help and Rules"
        description="Readable explanation of progression safeguards and DM authority."
      />
      <div className="help-grid">
        {sections.map((section) => (
          <Panel key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </Panel>
        ))}
      </div>
    </div>
  )
}
