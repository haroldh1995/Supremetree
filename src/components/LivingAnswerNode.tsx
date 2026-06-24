import { livingAnswer } from '../data/powers'
import { IconEmblem } from './IconEmblem'
import type { LivingAnswerStatus } from '../domain/types'

type LivingAnswerNodeProps = {
  status: LivingAnswerStatus
  onOpen: () => void
  onReveal: () => void
}

export function LivingAnswerNode({ status, onOpen, onReveal }: LivingAnswerNodeProps) {
  const stateClass =
    status.state === 'revealed' ? 'isRevealed' : status.mechanicallyAvailable ? 'isAvailable' : ''
  const statusText =
    status.state === 'revealed'
      ? 'Narratively Revealed'
      : status.mechanicallyAvailable
        ? 'Mechanically Available'
        : 'Locked'

  return (
    <div
      className={`livingAnswerNode ${stateClass}`}
      style={{
        left: `${(livingAnswer.visualPosition.x / 1000) * 100}%`,
        top: `${(livingAnswer.visualPosition.y / 1280) * 100}%`,
      }}
    >
      <button
        type="button"
        className="livingMedallion"
        onClick={onOpen}
        aria-label={`The Living Answer. ${statusText}. ${status.requiredPowersComplete} of ${status.requiredPowersTotal} required powers fully manifested.`}
        data-testid="living-answer-node"
      >
        <IconEmblem iconKey="living" />
      </button>
      <strong>The Living Answer</strong>
      <span>{statusText}</span>
      <small>
        {status.requiredPowersComplete}/{status.requiredPowersTotal} powers complete
      </small>
      {status.mechanicallyAvailable && status.state !== 'revealed' ? (
        <button className="revealLivingButton" type="button" onClick={onReveal}>
          Reveal The Living Answer
        </button>
      ) : null}
    </div>
  )
}
