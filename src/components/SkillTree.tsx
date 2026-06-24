import { useMemo, useRef, useState, type WheelEvent } from 'react'
import { livingAnswer, powers, tierLabels } from '../data/powers'
import { calculateConvergenceStatus } from '../domain/convergence'
import { getEligibleCandidates, getIneligibleReasons } from '../domain/eligibility'
import { calculateLivingAnswerStatus } from '../domain/livingAnswer'
import { ConnectionLayer } from './ConnectionLayer'
import { ConvergenceEngineNode } from './ConvergenceEngineNode'
import { LivingAnswerNode } from './LivingAnswerNode'
import { PowerNode } from './PowerNode'
import { TierPlaque } from './TierPlaque'
import { TierSection } from './TierSection'
import type { AppProgress, PowerDefinition } from '../domain/types'

type SkillTreeProps = {
  progress: AppProgress
  highlightedPowerId?: string
  onSelectPower: (power: PowerDefinition) => void
  onOpenLivingAnswer: () => void
  onRevealLivingAnswer: () => void
}

type PanState = {
  x: number
  y: number
}

export function SkillTree({
  progress,
  highlightedPowerId,
  onSelectPower,
  onOpenLivingAnswer,
  onRevealLivingAnswer,
}: SkillTreeProps) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 })
  const dragRef = useRef<
    { pointerId: number; startX: number; startY: number; pan: PanState } | undefined
  >(undefined)

  const eligible = useMemo(() => getEligibleCandidates(powers, progress), [progress])
  const eligibleById = new Map(eligible.map((candidate) => [candidate.power.id, candidate]))
  const ineligibleById = new Map(
    getIneligibleReasons(powers, progress).map((reason) => [reason.powerId, reason]),
  )
  const convergence = calculateConvergenceStatus(powers, progress)
  const livingStatus = calculateLivingAnswerStatus(powers, progress)
  const ordinaryPowers = powers.filter((power) => power.id !== 'convergence-engine')

  const setZoom = (next: number) => {
    const clamped = Math.min(1.7, Math.max(0.82, next))
    setScale(clamped)
    if (clamped <= 1) {
      setPan({ x: 0, y: 0 })
    }
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && Math.abs(event.deltaY) < 12) {
      return
    }
    event.preventDefault()
    setZoom(scale + (event.deltaY < 0 ? 0.08 : -0.08))
  }

  return (
    <section className="treeShell" aria-label="Dumare Supreme Power Tree">
      <div className="treeControls" aria-label="Tree zoom controls">
        <button type="button" onClick={() => setZoom(scale + 0.12)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => setZoom(scale - 0.12)} aria-label="Zoom out">
          -
        </button>
        <button
          type="button"
          onClick={() => {
            setScale(1)
            setPan({ x: 0, y: 0 })
          }}
        >
          Reset View
        </button>
        <button
          type="button"
          onClick={() => {
            setScale(0.9)
            setPan({ x: 0, y: 0 })
          }}
        >
          Fit To Screen
        </button>
      </div>
      <div
        className="treeViewport"
        onWheel={handleWheel}
        onPointerDown={(event) => {
          if (scale <= 1 || event.button !== 0) {
            return
          }
          event.currentTarget.setPointerCapture(event.pointerId)
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            pan,
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          if (!drag || drag.pointerId !== event.pointerId) {
            return
          }
          setPan({
            x: drag.pan.x + event.clientX - drag.startX,
            y: drag.pan.y + event.clientY - drag.startY,
          })
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = undefined
          }
        }}
      >
        <div
          className="treeCanvas"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          <div className="ruinBackdrop" aria-hidden="true" />
          <ConnectionLayer progress={progress} />
          {tierLabels.map((tier) => (
            <TierPlaque key={tier.tier} title={tier.title} subtitle={tier.subtitle} y={tier.y} />
          ))}
          <TierSection label="Ordinary powers">
            {ordinaryPowers.map((power) => {
              const powerProgress = progress.powers[power.id]
              if (!powerProgress) {
                return null
              }
              return (
                <PowerNode
                  key={power.id}
                  power={power}
                  progress={powerProgress}
                  candidate={eligibleById.get(power.id)}
                  ineligibleReason={ineligibleById.get(power.id)}
                  highlighted={highlightedPowerId === power.id}
                  onSelect={onSelectPower}
                />
              )
            })}
          </TierSection>
          <ConvergenceEngineNode
            progress={progress}
            status={convergence}
            highlighted={highlightedPowerId === 'convergence-engine'}
            onSelect={onSelectPower}
          />
          <LivingAnswerNode
            status={livingStatus}
            onOpen={onOpenLivingAnswer}
            onReveal={onRevealLivingAnswer}
          />
          <div
            className="livingConnectionLabel"
            style={{
              left: `${(livingAnswer.visualPosition.x / 1000) * 100}%`,
              top: `${((livingAnswer.visualPosition.y + 82) / 1280) * 100}%`,
            }}
          >
            Final unlock - not randomly rolled
          </div>
        </div>
      </div>
    </section>
  )
}
