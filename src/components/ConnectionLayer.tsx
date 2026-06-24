import { livingAnswer, powers } from '../data/powers'
import type { AppProgress, PowerDefinition } from '../domain/types'

type ConnectionLayerProps = {
  progress: AppProgress
}

export function ConnectionLayer({ progress }: ConnectionLayerProps) {
  const byId = new Map<string, PowerDefinition>(powers.map((power) => [power.id, power]))

  return (
    <svg className="connectionLayer" viewBox="0 0 1000 1280" aria-hidden="true" focusable="false">
      <defs>
        <filter id="connectionGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {powers.flatMap((source) =>
        source.connectionTargets.map((targetId) => {
          const target = byId.get(targetId)
          const targetPosition = target?.visualPosition ?? livingAnswer.visualPosition
          const sourceState = progress.powers[source.id]?.state ?? 'unmanifested'
          const targetState = target
            ? (progress.powers[target.id]?.state ?? 'unmanifested')
            : undefined
          const active =
            sourceState === 'fully_manifested' &&
            (targetId === livingAnswer.id || targetState === 'fully_manifested')
          const partial =
            !active &&
            (sourceState === 'first_manifestation' || targetState === 'first_manifestation')
          return (
            <line
              key={`${source.id}-${targetId}`}
              x1={source.visualPosition.x}
              y1={source.visualPosition.y}
              x2={targetPosition.x}
              y2={targetPosition.y}
              className={`connectionLine${active ? ' isActive' : ''}${partial ? ' isPartial' : ''}`}
              filter={active || partial ? 'url(#connectionGlow)' : undefined}
            />
          )
        }),
      )}
      <path d="M230 1110H770M230 875H770M230 640H770M260 405H740" className="connectionBackbone" />
    </svg>
  )
}
