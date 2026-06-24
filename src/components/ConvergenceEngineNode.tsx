import { powers } from '../data/powers'
import { IconEmblem } from './IconEmblem'
import { stateToLabel } from './PowerNode'
import type { CSSProperties } from 'react'
import type { AppProgress, ConvergenceStatus, PowerDefinition } from '../domain/types'

type ConvergenceEngineNodeProps = {
  progress: AppProgress
  status: ConvergenceStatus
  highlighted: boolean
  onSelect: (power: PowerDefinition) => void
}

export function ConvergenceEngineNode({
  progress,
  status,
  highlighted,
  onSelect,
}: ConvergenceEngineNodeProps) {
  const power = powers.find((candidate) => candidate.id === 'convergence-engine')
  if (!power) {
    return null
  }
  const powerProgress = progress.powers[power.id]
  if (!powerProgress) {
    return null
  }
  const style = {
    left: `${(power.visualPosition.x / 1000) * 100}%`,
    top: `${(power.visualPosition.y / 1280) * 100}%`,
    '--sync-ratio': `${status.synchronizationRatio}`,
  } as CSSProperties

  return (
    <button
      type="button"
      className={`convergenceNode powerNode--${powerProgress.state}${highlighted ? ' isHighlighted' : ''}`}
      style={style}
      onClick={() => onSelect(power)}
      aria-label={`20. Convergence Engine. ${stateToLabel(powerProgress.state)}. ${status.synchronizedFullyManifested} of ${status.synchronizationTotal} supporting powers fully manifested.`}
      data-testid="convergence-node"
      data-state={powerProgress.state}
    >
      <span className="nodeNumber">20</span>
      <span className="convergenceMedallion">
        <IconEmblem iconKey="convergence" />
      </span>
      <strong>Convergence Engine</strong>
      <small>
        {status.synchronizedFullyManifested}/{status.synchronizationTotal} synchronized
      </small>
    </button>
  )
}
