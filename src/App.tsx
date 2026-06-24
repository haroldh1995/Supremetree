import { useEffect, useMemo, useRef, useState } from 'react'
import { CANONICAL_DATA_HASH, powers } from './data/powers'
import { loadAutosave, saveAutosave } from './domain/autosave'
import { assertValidCanonicalData } from './domain/canonicalValidation'
import { calculateConvergenceStatus } from './domain/convergence'
import { getEligibleCandidates } from './domain/eligibility'
import {
  calculateLivingAnswerStatus,
  syncLivingAnswerAvailability,
  revealLivingAnswer,
} from './domain/livingAnswer'
import {
  commitPendingManifestation,
  createInitialProgress,
  createPendingManifestation,
  resetProgress,
} from './domain/progression'
import { selectRandomCandidate } from './domain/random'
import { createSavePayload, getSaveFilename, parseSaveFile } from './domain/save'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HistoryPanel } from './components/HistoryPanel'
import { ManifestButton } from './components/ManifestButton'
import { ManifestReveal } from './components/ManifestReveal'
import { PowerDetails } from './components/PowerDetails'
import { SaveLoadControls } from './components/SaveLoadControls'
import { SkillTree } from './components/SkillTree'
import { StartScreen } from './components/StartScreen'
import type {
  AppProgress,
  PendingManifestation,
  PowerDefinition,
  SavePayload,
} from './domain/types'

assertValidCanonicalData()

document.documentElement.style.setProperty(
  '--blueprint-image',
  `url("${import.meta.env.BASE_URL}assets/dumare-supreme-power-tree-blueprint.jpg")`,
)

type DialogState =
  | { type: 'reset' }
  | { type: 'load'; payload: SavePayload }
  | { type: 'reveal-living-answer' }
  | undefined

type SelectedDetails =
  | { type: 'power'; power: PowerDefinition }
  | { type: 'living-answer' }
  | undefined

function App() {
  return (
    <ErrorBoundary>
      <DumareTreeApp />
    </ErrorBoundary>
  )
}

function DumareTreeApp() {
  const [localProgress, setLocalProgress] = useState<AppProgress | undefined>(() => loadAutosave())
  const [started, setStarted] = useState(() => Boolean(localProgress))
  const [progress, setProgress] = useState<AppProgress>(
    () => localProgress ?? createInitialProgress(powers),
  )
  const [selectedDetails, setSelectedDetails] = useState<SelectedDetails>()
  const [dialog, setDialog] = useState<DialogState>()
  const [loadError, setLoadError] = useState<string>()
  const [highlightedPowerId, setHighlightedPowerId] = useState<string>()
  const [manifestAnimating, setManifestAnimating] = useState(false)
  const [revealReady, setRevealReady] = useState(Boolean(progress.pendingManifestation))
  const [announcement, setAnnouncement] = useState('')
  const cycleTimerRef = useRef<number | undefined>(undefined)
  const revealTimerRef = useRef<number | undefined>(undefined)

  const eligibleCandidates = useMemo(() => getEligibleCandidates(powers, progress), [progress])
  const convergenceStatus = useMemo(() => calculateConvergenceStatus(powers, progress), [progress])
  const livingStatus = useMemo(() => calculateLivingAnswerStatus(powers, progress), [progress])
  const currentPendingPower = progress.pendingManifestation
    ? powers.find((power) => power.id === progress.pendingManifestation?.powerId)
    : undefined

  useEffect(() => {
    if (started) {
      saveAutosave(progress)
      setLocalProgress(progress)
    }
  }, [progress, started])

  useEffect(() => {
    return () => {
      if (cycleTimerRef.current) {
        window.clearInterval(cycleTimerRef.current)
      }
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current)
      }
    }
  }, [])

  if (!started) {
    return (
      <>
        <StartScreen
          hasAutosave={Boolean(localProgress)}
          onContinue={() => {
            setProgress(localProgress ?? createInitialProgress(powers))
            setStarted(true)
            setRevealReady(Boolean(localProgress?.pendingManifestation))
          }}
          onStartNew={() => {
            const fresh = createInitialProgress(powers)
            setProgress(fresh)
            setStarted(true)
            setRevealReady(false)
          }}
          onLoadClick={() => document.getElementById('start-load-input')?.click()}
        />
        <input
          id="start-load-input"
          className="srOnly"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (!file) {
              return
            }
            void file.text().then(handleLoadText)
            event.currentTarget.value = ''
          }}
        />
        {dialog ? renderDialog(dialog) : null}
      </>
    )
  }

  const selectedPowerProgress =
    selectedDetails?.type === 'power' ? progress.powers[selectedDetails.power.id] : undefined
  const manifestDisabled =
    manifestAnimating ||
    Boolean(progress.pendingManifestation) ||
    eligibleCandidates.length === 0 ||
    progress.livingAnswer.state === 'revealed'

  return (
    <main className={`appRoot${manifestAnimating ? ' isManifesting' : ''}`}>
      <div className="srOnly" role="status" aria-live="polite">
        {announcement}
      </div>
      <header className="appHeader">
        <div>
          <p>Dumare D20 Superpower Tree</p>
          <h1>DUMARE — SUPREME POWER TREE</h1>
        </div>
        <SaveLoadControls
          busy={manifestAnimating || Boolean(progress.pendingManifestation)}
          onSave={handleSave}
          onLoadText={handleLoadText}
          onReset={() => setDialog({ type: 'reset' })}
          error={loadError}
        />
      </header>
      <footer className="controlDeck">
        <div className="statusStrip">
          <span>{eligibleCandidates.length} eligible powers</span>
          <span>
            Convergence {convergenceStatus.synchronizedFullyManifested}/
            {convergenceStatus.synchronizationTotal}
          </span>
          <span>Source hash {CANONICAL_DATA_HASH.slice(0, 10)}</span>
          <button type="button" className="inlineToggle" onClick={toggleReducedMotion}>
            Motion: {progress.preferences.reducedMotion ? 'Reduced' : 'Dramatic'}
          </button>
        </div>
        <ManifestButton
          disabled={manifestDisabled}
          eligibleCount={eligibleCandidates.length}
          onManifest={handleManifest}
        />
        <p id="manifest-help" className="manifestHelp">
          Manifest randomly selects one eligible D20 power. The Living Answer is never randomly
          rolled.
        </p>
      </footer>
      <SkillTree
        progress={progress}
        highlightedPowerId={highlightedPowerId}
        onSelectPower={(power) => setSelectedDetails({ type: 'power', power })}
        onOpenLivingAnswer={() => setSelectedDetails({ type: 'living-answer' })}
        onRevealLivingAnswer={() => setDialog({ type: 'reveal-living-answer' })}
      />
      <HistoryPanel history={progress.history} />
      {manifestAnimating ? (
        <button type="button" className="skipAnimationButton" onClick={skipAnimation}>
          Skip Animation
        </button>
      ) : null}
      {currentPendingPower && progress.pendingManifestation && revealReady ? (
        <ManifestReveal
          power={currentPendingPower}
          pending={progress.pendingManifestation}
          animating={manifestAnimating}
          onAcknowledge={handleAcknowledge}
          onSkipAnimation={skipAnimation}
        />
      ) : null}
      {selectedDetails ? (
        <PowerDetails
          power={selectedDetails.type === 'power' ? selectedDetails.power : undefined}
          progress={selectedPowerProgress}
          livingAnswerOpen={selectedDetails.type === 'living-answer'}
          livingAnswerStatus={livingStatus}
          appProgress={progress}
          onClose={() => setSelectedDetails(undefined)}
        />
      ) : null}
      {dialog ? renderDialog(dialog) : null}
    </main>
  )

  function handleManifest() {
    const candidates = getEligibleCandidates(powers, progress)
    if (candidates.length === 0) {
      setAnnouncement('No eligible powers are available.')
      return
    }

    const selected = selectRandomCandidate(candidates)
    const selectedAt = new Date().toISOString()
    const pending = createPendingManifestation(
      selected.power,
      selected.progress,
      progress.history.length + 1,
      selectedAt,
    )
    const pendingProgress = {
      ...progress,
      pendingManifestation: pending,
    }

    setProgress(pendingProgress)
    setRevealReady(false)
    setManifestAnimating(true)
    setAnnouncement(`${selected.power.name} selected. Manifestation reveal incoming.`)
    startCycling(
      candidates.map((candidate) => candidate.power.id),
      pending,
    )
  }

  function toggleReducedMotion() {
    setProgress({
      ...progress,
      preferences: {
        ...progress.preferences,
        reducedMotion: !progress.preferences.reducedMotion,
      },
    })
  }

  function startCycling(candidateIds: string[], pending: PendingManifestation) {
    let index = 0
    if (cycleTimerRef.current) {
      window.clearInterval(cycleTimerRef.current)
    }
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
    }
    cycleTimerRef.current = window.setInterval(() => {
      const id = candidateIds[index % candidateIds.length]
      if (id) {
        setHighlightedPowerId(id)
      }
      index += 1
    }, 110)

    const duration = progress.preferences.reducedMotion ? 80 : 2100
    revealTimerRef.current = window.setTimeout(() => {
      finishAnimation(pending.powerId)
    }, duration)
  }

  function finishAnimation(powerId: string) {
    if (cycleTimerRef.current) {
      window.clearInterval(cycleTimerRef.current)
      cycleTimerRef.current = undefined
    }
    setHighlightedPowerId(powerId)
    setManifestAnimating(false)
    setRevealReady(true)
  }

  function skipAnimation() {
    const pending = progress.pendingManifestation
    if (!pending) {
      return
    }
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = undefined
    }
    finishAnimation(pending.powerId)
  }

  function handleAcknowledge() {
    const pending = progress.pendingManifestation
    if (!pending) {
      return
    }
    const power = powers.find((candidate) => candidate.id === pending.powerId)
    if (!power) {
      setLoadError('Pending manifestation references a missing power.')
      return
    }
    const committed = commitPendingManifestation(progress, power, pending)
    const cooled = updateCooldownForPending(committed, pending)
    const synced = syncLivingAnswerAvailability(powers, cooled)
    setProgress(synced)
    setRevealReady(false)
    setHighlightedPowerId(power.id)
    setAnnouncement(`${power.name} committed as ${pending.kind}.`)
  }

  function updateCooldownForPending(appProgress: AppProgress, pending: PendingManifestation) {
    if (pending.nextState === 'first_manifestation') {
      return {
        ...appProgress,
        cooldown: { blockedPowerId: pending.powerId },
      }
    }
    return {
      ...appProgress,
      cooldown: {},
    }
  }

  function handleSave() {
    const payload = createSavePayload(progress)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = getSaveFilename()
    anchor.click()
    URL.revokeObjectURL(url)
    setAnnouncement('Progress save file downloaded.')
  }

  function handleLoadText(text: string) {
    try {
      const payload = parseSaveFile(text)
      setLoadError(undefined)
      setDialog({ type: 'load', payload })
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load that save file.')
    }
  }

  function renderDialog(state: Exclude<DialogState, undefined>) {
    if (state.type === 'reset') {
      return (
        <ConfirmDialog
          title="Reset Progress?"
          confirmLabel="Reset Progress"
          destructive
          onCancel={() => setDialog(undefined)}
          onConfirm={() => {
            const fresh = resetProgress(powers, progress.preferences)
            setProgress(fresh)
            setRevealReady(false)
            setHighlightedPowerId(undefined)
            setDialog(undefined)
            setAnnouncement('Progress reset.')
          }}
        >
          <p>Save your progress first if you may want to restore it later.</p>
          <p>
            Reset clears all manifested powers, history, cooldown, pending results, Convergence, and
            The Living Answer.
          </p>
        </ConfirmDialog>
      )
    }

    if (state.type === 'load') {
      return (
        <ConfirmDialog
          title="Load This Save?"
          confirmLabel="Load Progress"
          onCancel={() => setDialog(undefined)}
          onConfirm={() => {
            setProgress(syncLivingAnswerAvailability(powers, state.payload.progress))
            setStarted(true)
            setRevealReady(Boolean(state.payload.progress.pendingManifestation))
            setDialog(undefined)
            setAnnouncement('Progress loaded.')
          }}
        >
          <p>
            Saved at {new Date(state.payload.savedAt).toLocaleString()} with{' '}
            {state.payload.progress.history.length} manifestation entries.
          </p>
          <p>Current progress will be replaced only after confirmation.</p>
        </ConfirmDialog>
      )
    }

    return (
      <ConfirmDialog
        title="Reveal The Living Answer?"
        confirmLabel="Reveal"
        onCancel={() => setDialog(undefined)}
        onConfirm={() => {
          const revealed = revealLivingAnswer(progress, new Date().toISOString())
          setProgress(revealed)
          setDialog(undefined)
          setAnnouncement('The Living Answer has been narratively revealed.')
        }}
      >
        <p>
          The Living Answer is mechanically available. Confirm only when the narrative reveal
          occurs.
        </p>
        <p>The mana battery remains a separate emergency-only mechanism.</p>
      </ConfirmDialog>
    )
  }
}

export default App
