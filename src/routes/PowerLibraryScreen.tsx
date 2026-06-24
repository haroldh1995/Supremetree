import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { powerDefinitions } from '../data/powers'
import { buildDrawCandidates } from '../domain/randomizer'
import {
  Button,
  Field,
  PageHeader,
  Panel,
  SelectInput,
  TextInput,
  stateLabel,
} from '../components/common'
import { useAppState } from '../state/AppState'
import type { PowerProgress } from '../domain/types'

type FilterValue =
  | 'all'
  | 'locked'
  | 'manifested'
  | 'fully-realized'
  | 'eligible'
  | 'ineligible'
  | 'rollable'
  | 'milestone'
  | 'has-backlash'
  | 'required'

type SortValue =
  | 'canonical'
  | 'weakest'
  | 'state'
  | 'tier'
  | 'recent'
  | 'least-recent'
  | 'highest-weight'
  | 'lowest-weight'

export function PowerLibraryScreen() {
  const { data, actions } = useAppState()
  const [filter, setFilter] = useState<FilterValue>('all')
  const [sort, setSort] = useState<SortValue>('canonical')
  const [tier, setTier] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const candidates = useMemo(() => {
    if (!data.settings) return []
    return buildDrawCandidates({
      settings: data.settings,
      progress: data.powerProgress,
      sessions: data.sessions,
      catchUpCredits: data.catchUpCredits,
    })
  }, [data.catchUpCredits, data.powerProgress, data.sessions, data.settings])
  const candidateById = new Map(candidates.map((candidate) => [candidate.power.id, candidate]))
  const progressById = new Map(data.powerProgress.map((progress) => [progress.powerId, progress]))
  const categories = Array.from(new Set(powerDefinitions.map((power) => power.category))).sort()

  const powers = powerDefinitions
    .filter((power) => {
      const progress = progressById.get(power.id)
      const candidate = candidateById.get(power.id)
      if (!progress) return false
      if (tier !== 'all' && String(progress.tierOverride ?? power.tier) !== tier) return false
      if (category !== 'all' && power.category !== category) return false
      if (
        query &&
        !`${power.name} ${power.shortSummary}`.toLowerCase().includes(query.toLowerCase())
      )
        return false
      if (filter === 'all') return true
      if (filter === 'eligible') return Boolean(candidate?.eligible)
      if (filter === 'ineligible') return !candidate?.eligible
      if (filter === 'rollable') return power.isRandomlySelectable
      if (filter === 'milestone') return power.isMilestoneControlled
      if (filter === 'has-backlash') return Boolean(power.firstRollBacklash)
      if (filter === 'required') return power.isRequiredForLivingAnswer
      return progress.state === filter
    })
    .sort((a, b) => {
      const progressA = progressById.get(a.id)
      const progressB = progressById.get(b.id)
      const candidateA = candidateById.get(a.id)
      const candidateB = candidateById.get(b.id)
      if (sort === 'weakest' || sort === 'canonical') return a.displayNumber - b.displayNumber
      if (sort === 'tier')
        return (progressA?.tierOverride ?? a.tier) - (progressB?.tierOverride ?? b.tier)
      if (sort === 'state') return (progressA?.state ?? '').localeCompare(progressB?.state ?? '')
      if (sort === 'recent')
        return (progressB?.lastAdvancedAt ?? '').localeCompare(progressA?.lastAdvancedAt ?? '')
      if (sort === 'least-recent')
        return (progressA?.lastAdvancedAt ?? '').localeCompare(progressB?.lastAdvancedAt ?? '')
      if (sort === 'highest-weight') return (candidateB?.weight ?? 0) - (candidateA?.weight ?? 0)
      if (sort === 'lowest-weight') return (candidateA?.weight ?? 0) - (candidateB?.weight ?? 0)
      return 0
    })

  async function quickToggle(
    progress: PowerProgress,
    key: 'narrativeLocked' | 'temporaryExcluded',
  ) {
    const updated = { ...progress, [key]: !progress[key] }
    await actions.updatePowerProgress(updated, `${key} changed from Power Library.`)
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Power Library"
        description="Canonical DOCX content is separated from editable campaign state and DM notes."
      />
      <Panel>
        <div className="filter-bar">
          <Field label="Search">
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} />
          </Field>
          <Field label="Filter">
            <SelectInput
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterValue)}
            >
              <option value="all">All</option>
              <option value="locked">Locked</option>
              <option value="manifested">Manifested</option>
              <option value="fully-realized">Fully realized</option>
              <option value="eligible">Eligible</option>
              <option value="ineligible">Ineligible</option>
              <option value="rollable">Rollable</option>
              <option value="milestone">Milestone controlled</option>
              <option value="has-backlash">Has backlash</option>
              <option value="required">Required for The Living Answer</option>
            </SelectInput>
          </Field>
          <Field label="Tier">
            <SelectInput value={tier} onChange={(event) => setTier(event.target.value)}>
              <option value="all">All tiers</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  Tier {value}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Category">
            <SelectInput value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Sort">
            <SelectInput
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
            >
              <option value="canonical">Canonical order</option>
              <option value="weakest">Weakest to strongest</option>
              <option value="state">Current state</option>
              <option value="tier">Tier</option>
              <option value="recent">Most recently advanced</option>
              <option value="least-recent">Least recently advanced</option>
              <option value="highest-weight">Highest random weight</option>
              <option value="lowest-weight">Lowest random weight</option>
            </SelectInput>
          </Field>
        </div>
      </Panel>
      <div className="power-grid">
        {powers.map((power) => {
          const progress = progressById.get(power.id)
          const candidate = candidateById.get(power.id)
          if (!progress) return null
          return (
            <article key={power.id} className={`power-card state-${progress.state}`}>
              <div className="power-number">{power.displayNumber}</div>
              <div>
                <h2>{power.name}</h2>
                <p>{power.shortSummary}</p>
                <dl className="summary-list">
                  <dt>Tier</dt>
                  <dd>{progress.tierOverride ?? power.tier}</dd>
                  <dt>Category</dt>
                  <dd>{power.category}</dd>
                  <dt>State</dt>
                  <dd data-testid={`power-state-${power.id}`}>{stateLabel(progress.state)}</dd>
                  <dt>Manifestations</dt>
                  <dd>{progress.manifestationCount}</dd>
                  <dt>Weight</dt>
                  <dd>{candidate?.weight ?? 0}</dd>
                </dl>
                <p className="muted">
                  {candidate?.eligible
                    ? candidate.reasons.join(', ')
                    : candidate?.ineligibleReasons.join(', ') || 'Eligibility unavailable'}
                </p>
              </div>
              <div className="record-actions">
                <Link className="button button-primary" to={`/powers/${power.id}`}>
                  Details
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => void quickToggle(progress, 'narrativeLocked')}
                >
                  {progress.narrativeLocked ? 'Unlock' : 'Narrative Lock'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void quickToggle(progress, 'temporaryExcluded')}
                >
                  {progress.temporaryExcluded ? 'Include' : 'Exclude'}
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
