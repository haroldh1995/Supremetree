import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { powerDefinitions } from '../data/powers'
import { PageHeader, Panel, stateLabel } from '../components/common'
import { buildDrawCandidates } from '../domain/randomizer'
import { useAppState } from '../state/AppState'

const nodePositions = powerDefinitions.map((power) => {
  const row = power.tier
  const rowItems = powerDefinitions.filter((candidate) => candidate.tier === row)
  const indexInRow = rowItems.findIndex((candidate) => candidate.id === power.id)
  const x = 120 + indexInRow * 170 + (5 - rowItems.length) * 80
  const y = 520 - row * 95
  return { id: power.id, x, y }
})

export function SkillTreeScreen() {
  const { data } = useAppState()
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selectedId, setSelectedId] = useState(powerDefinitions[0]?.id ?? '')
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const progressById = new Map(data.powerProgress.map((progress) => [progress.powerId, progress]))
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
  const selectedPower = powerDefinitions.find((power) => power.id === selectedId)
  const selectedProgress = selectedPower ? progressById.get(selectedPower.id) : undefined

  return (
    <div className="screen-stack">
      <PageHeader
        title="Interactive Skill Tree"
        description="Connections are thematic and convergence-oriented; randomized progression does not require connected-node sequencing."
      />
      <div className="tree-layout">
        <Panel className="reference-viewer">
          <h2>Uploaded Reference Image</h2>
          <img
            src="/assets/dumare-skill-tree.jpg"
            alt="Current uploaded Dumare skill-tree visual reference"
          />
        </Panel>
        <Panel className="interactive-tree-panel">
          <div className="tree-toolbar">
            <button type="button" onClick={() => setZoom((value) => Math.min(2.2, value + 0.15))}>
              Zoom In
            </button>
            <button type="button" onClick={() => setZoom((value) => Math.max(0.45, value - 0.15))}>
              Zoom Out
            </button>
            <button type="button" onClick={() => setOffset({ x: 0, y: 0 })}>
              Reset View
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(0.9)
                setOffset({ x: 0, y: 20 })
              }}
            >
              Fit to Screen
            </button>
          </div>
          <div
            className="tree-canvas"
            role="application"
            aria-label="Interactive power tree. Use the toolbar to pan and zoom."
            onPointerDown={(event) => {
              dragStart.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (!dragStart.current) return
              setOffset({
                x: dragStart.current.ox + event.clientX - dragStart.current.x,
                y: dragStart.current.oy + event.clientY - dragStart.current.y,
              })
            }}
            onPointerUp={() => {
              dragStart.current = null
            }}
          >
            <svg
              viewBox="0 0 1000 620"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            >
              {nodePositions.slice(0, -1).map((node, index) => {
                const next = nodePositions[index + 1]
                if (!next) return null
                return (
                  <line
                    key={`${node.id}-${next.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={next.x}
                    y2={next.y}
                  />
                )
              })}
              {nodePositions.map((node) => {
                const power = powerDefinitions.find((item) => item.id === node.id)
                const progress = progressById.get(node.id)
                const candidate = candidateById.get(node.id)
                if (!power || !progress) return null
                return (
                  <g key={node.id} className={`tree-node state-${progress.state}`}>
                    <g
                      role="button"
                      tabIndex={0}
                      className="svg-button"
                      aria-label={`${power.name}, ${stateLabel(progress.state)}, ${
                        candidate?.eligible ? 'eligible' : 'ineligible'
                      }`}
                      onClick={() => setSelectedId(power.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedId(power.id)
                        }
                      }}
                    >
                      <circle cx={node.x} cy={node.y} r={34} />
                      <text x={node.x} y={node.y - 4} textAnchor="middle">
                        {power.displayNumber}
                      </text>
                      <text x={node.x} y={node.y + 14} textAnchor="middle">
                        {candidate?.eligible ? 'E' : '-'}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
          </div>
        </Panel>
        <Panel>
          <h2>Selected Power</h2>
          {selectedPower && selectedProgress ? (
            <>
              <h3>{selectedPower.name}</h3>
              <p>{selectedPower.shortSummary}</p>
              <p>State: {stateLabel(selectedProgress.state)}</p>
              <p>
                Eligibility:{' '}
                {candidateById.get(selectedPower.id)?.eligible
                  ? 'Eligible'
                  : candidateById.get(selectedPower.id)?.ineligibleReasons.join(', ')}
              </p>
              <Link className="button button-primary" to={`/powers/${selectedPower.id}`}>
                Open Details
              </Link>
            </>
          ) : null}
        </Panel>
      </div>
      <Panel>
        <h2>Accessible Tree List</h2>
        <ol className="accessible-tree-list">
          {powerDefinitions.map((power) => {
            const progress = progressById.get(power.id)
            return (
              <li key={power.id}>
                <Link to={`/powers/${power.id}`}>
                  {power.displayNumber}. {power.name} - {stateLabel(progress?.state ?? 'locked')}
                </Link>
              </li>
            )
          })}
        </ol>
      </Panel>
    </div>
  )
}
