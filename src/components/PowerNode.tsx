import { IconEmblem } from './IconEmblem'
import type {
  EligibleCandidate,
  IneligibleReason,
  PowerDefinition,
  PowerProgress,
} from '../domain/types'

type PowerNodeProps = {
  power: PowerDefinition
  progress: PowerProgress
  candidate?: EligibleCandidate
  ineligibleReason?: IneligibleReason
  highlighted: boolean
  onSelect: (power: PowerDefinition) => void
}

export function PowerNode({
  power,
  progress,
  candidate,
  ineligibleReason,
  highlighted,
  onSelect,
}: PowerNodeProps) {
  const stateLabel = stateToLabel(progress.state)
  const style = {
    left: `${(power.visualPosition.x / 1000) * 100}%`,
    top: `${(power.visualPosition.y / 1280) * 100}%`,
  }
  const eligibleText = candidate
    ? `Eligible. ${candidate.reason}`
    : `Ineligible. ${ineligibleReason?.reason ?? 'Not currently eligible.'}`

  return (
    <button
      type="button"
      className={`powerNode powerNode--${progress.state}${highlighted ? ' isHighlighted' : ''}`}
      style={style}
      onClick={() => onSelect(power)}
      aria-label={`${power.number}. ${power.name}. ${stateLabel}. ${eligibleText}`}
      data-testid={`power-node-${power.id}`}
      data-state={progress.state}
    >
      <span className="nodeNumber">{power.number}</span>
      <span className="nodeMedallion">
        <IconEmblem iconKey={power.iconKey} />
        <span className="stateRune" aria-hidden="true">
          {progress.state === 'fully_manifested'
            ? 'II'
            : progress.state === 'first_manifestation'
              ? 'I'
              : '0'}
        </span>
      </span>
      <span className="nodeName">{power.name}</span>
      <span className="srOnly">{stateLabel}</span>
    </button>
  )
}

export function stateToLabel(state: PowerProgress['state']): string {
  if (state === 'first_manifestation') {
    return 'First Manifestation'
  }
  if (state === 'fully_manifested') {
    return 'Fully Manifested'
  }
  return 'Unmanifested'
}
