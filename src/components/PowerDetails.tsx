import { livingAnswer } from '../data/powers'
import { IconEmblem } from './IconEmblem'
import { stateToLabel } from './PowerNode'
import { useEffect, useRef, type ReactNode } from 'react'
import type {
  AppProgress,
  LivingAnswerStatus,
  PowerDefinition,
  PowerProgress,
} from '../domain/types'

type PowerDetailsProps = {
  power?: PowerDefinition
  progress?: PowerProgress
  livingAnswerOpen: boolean
  livingAnswerStatus: LivingAnswerStatus
  appProgress: AppProgress
  onClose: () => void
}

export function PowerDetails({
  power,
  progress,
  livingAnswerOpen,
  livingAnswerStatus,
  appProgress,
  onClose,
}: PowerDetailsProps) {
  if (livingAnswerOpen) {
    return (
      <DetailShell title={livingAnswer.name} onClose={onClose}>
        <div className="detailHero livingDetailHero">
          <IconEmblem iconKey="living" />
          <div>
            <p className="detailKicker">Final Completion Unlock</p>
            <h2>{livingAnswer.name}</h2>
            <p>{livingAnswer.shortDescription}</p>
          </div>
        </div>
        <DetailSection title="Status">
          <p>
            {livingAnswerStatus.state === 'revealed'
              ? 'Narratively revealed.'
              : livingAnswerStatus.mechanicallyAvailable
                ? 'Mechanically available, awaiting explicit reveal.'
                : 'Locked.'}
          </p>
          <p>
            {livingAnswerStatus.requiredPowersComplete}/{livingAnswerStatus.requiredPowersTotal}{' '}
            required powers are fully manifested.
          </p>
        </DetailSection>
        <DetailSection title="Unlock Requirement">
          <p>{livingAnswer.unlockRequirement}</p>
        </DetailSection>
        <DetailSection title="Description">
          <p>{livingAnswer.fullDescription}</p>
        </DetailSection>
        <DetailSection title="Weaknesses / Hard Counters">
          <p>{livingAnswer.weaknesses ?? 'Not supplied in the current DOCX.'}</p>
        </DetailSection>
        <DetailSection title="Mana Battery">
          <p>
            The Living Answer reveal is tracked separately from the mana battery. This app does not
            mark the battery as fully activated; its full function remains emergency-only.
          </p>
        </DetailSection>
      </DetailShell>
    )
  }

  if (!power || !progress) {
    return null
  }

  const relatedHistory = appProgress.history.filter((entry) => entry.powerId === power.id)

  return (
    <DetailShell title={power.name} onClose={onClose}>
      <div className="detailHero">
        <IconEmblem iconKey={power.iconKey} />
        <div>
          <p className="detailKicker">Power {power.number}</p>
          <h2>{power.name}</h2>
          <p>{power.shortDescription}</p>
        </div>
      </div>
      <dl className="detailMeta">
        <div>
          <dt>Current State</dt>
          <dd>{stateToLabel(progress.state)}</dd>
        </div>
        <div>
          <dt>Tier</dt>
          <dd>{power.tier === 'convergence' ? 'Convergence' : `Tier ${power.tier}`}</dd>
        </div>
        <div>
          <dt>Selections</dt>
          <dd>{progress.selectionCount}</dd>
        </div>
      </dl>
      <DetailSection title="Description">
        <p>{power.fullDescription}</p>
      </DetailSection>
      <DetailSection title="First-Roll Backlash">
        <p>
          {power.firstRollBacklash ?? 'No first-roll backlash was supplied in the current DOCX.'}
        </p>
      </DetailSection>
      <DetailSection title="Weaknesses / Hard Counters">
        <p>{power.weaknesses ?? power.hardCounters ?? 'Not supplied in the current DOCX.'}</p>
      </DetailSection>
      <DetailSection title="Convergence Synergies">
        <p>{power.convergenceSynergies ?? 'Not supplied in the current DOCX.'}</p>
      </DetailSection>
      {power.specialRules ? (
        <DetailSection title="Special Rules">
          <p>{power.specialRules}</p>
        </DetailSection>
      ) : null}
      <DetailSection title="Manifestation Timeline">
        <p>
          First Manifestation:{' '}
          {progress.firstManifestedAt
            ? formatDateTime(progress.firstManifestedAt)
            : 'Not manifested yet.'}
        </p>
        <p>
          Fully Manifested:{' '}
          {progress.fullyManifestedAt
            ? formatDateTime(progress.fullyManifestedAt)
            : 'Not fully manifested yet.'}
        </p>
        {relatedHistory.length > 0 ? (
          <ol className="detailHistory">
            {relatedHistory.map((entry) => (
              <li key={entry.id}>
                {entry.kind} on{' '}
                <time dateTime={entry.manifestedAt}>{formatDateTime(entry.manifestedAt)}</time>
              </li>
            ))}
          </ol>
        ) : null}
      </DetailSection>
    </DetailShell>
  )
}

function DetailShell({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    panelRef.current?.querySelector('button')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
      if (event.key !== 'Tab') {
        return
      }
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select',
        ) ?? [],
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
  }, [onClose])

  return (
    <div className="overlayRoot" role="presentation" data-testid="power-details">
      <div className="overlayBackdrop" onClick={onClose} />
      <section
        className="detailPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
      >
        <button type="button" className="closeButton" onClick={onClose} aria-label="Close details">
          x
        </button>
        {children}
      </section>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detailSection">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
