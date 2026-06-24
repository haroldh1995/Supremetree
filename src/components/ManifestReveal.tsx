import { useEffect, useRef } from 'react'
import { IconEmblem } from './IconEmblem'
import { stateToLabel } from './PowerNode'
import type { PendingManifestation, PowerDefinition } from '../domain/types'

type ManifestRevealProps = {
  power: PowerDefinition
  pending: PendingManifestation
  onAcknowledge: () => void
  onSkipAnimation?: () => void
  animating: boolean
}

export function ManifestReveal({
  power,
  pending,
  onAcknowledge,
  onSkipAnimation,
  animating,
}: ManifestRevealProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isFirst = pending.nextState === 'first_manifestation'

  useEffect(() => {
    const button = panelRef.current?.querySelector('button')
    button?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('button, [href]') ?? [],
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="overlayRoot revealOverlay" role="presentation" data-testid="manifest-reveal">
      <div className="overlayBackdrop" />
      <section
        className={`revealPanel ${isFirst ? 'firstReveal' : 'fullReveal'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reveal-title"
        ref={panelRef}
      >
        <div className="revealSigil">
          <IconEmblem iconKey={power.iconKey} />
        </div>
        <p className="revealNumber">Power {power.number}</p>
        <h2 id="reveal-title">{power.name}</h2>
        <p className="revealKind">{pending.kind}</p>
        <p className="revealSummary">{power.shortDescription}</p>
        <dl className="revealFacts">
          <div>
            <dt>Previous State</dt>
            <dd>{stateToLabel(pending.previousState)}</dd>
          </div>
          <div>
            <dt>New State On Acknowledgment</dt>
            <dd>{stateToLabel(pending.nextState)}</dd>
          </div>
          <div>
            <dt>Date & Time</dt>
            <dd>
              <time dateTime={pending.selectedAt}>{formatDateTime(pending.selectedAt)}</time>
            </dd>
          </div>
        </dl>
        <div className="revealTextGrid">
          <section>
            <h3>Description</h3>
            <p>{power.fullDescription}</p>
          </section>
          {isFirst ? (
            <section className="backlashBlock">
              <h3>First-Roll Backlash</h3>
              <p>
                {power.firstRollBacklash ??
                  'No first-roll backlash was supplied in the current DOCX.'}
              </p>
            </section>
          ) : (
            <section className="completionBlock">
              <h3>Random Pool</h3>
              <p>This power is now fully manifested and removed from future random rolls.</p>
            </section>
          )}
          <section>
            <h3>Weaknesses / Hard Counters</h3>
            <p>{power.weaknesses ?? power.hardCounters ?? 'Not supplied in the current DOCX.'}</p>
          </section>
          <section>
            <h3>Convergence Synergies</h3>
            <p>{power.convergenceSynergies ?? 'Not supplied in the current DOCX.'}</p>
          </section>
          {power.specialRules ? (
            <section>
              <h3>Special Rules</h3>
              <p>{power.specialRules}</p>
            </section>
          ) : null}
        </div>
        <div className="dialogActions revealActions">
          {animating && onSkipAnimation ? (
            <button type="button" className="secondaryButton" onClick={onSkipAnimation}>
              Skip Animation
            </button>
          ) : null}
          <button
            type="button"
            className="primaryButton"
            onClick={onAcknowledge}
            disabled={animating}
          >
            Acknowledge
          </button>
        </div>
      </section>
    </div>
  )
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
