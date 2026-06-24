type StartScreenProps = {
  hasAutosave: boolean
  onContinue: () => void
  onStartNew: () => void
  onLoadClick: () => void
}

export function StartScreen({
  hasAutosave,
  onContinue,
  onStartNew,
  onLoadClick,
}: StartScreenProps) {
  return (
    <main className="startScreen">
      <div className="startFrame">
        <p className="sourceMark">Dumare D20 Superpower Tree</p>
        <h1>DUMARE — SUPREME POWER TREE</h1>
        <p>
          Manifest powers from the current DOCX, preserve each First Manifestation and Fully
          Manifested result, then carry the tree between devices with a save file.
        </p>
        <div className="startActions">
          {hasAutosave ? (
            <button type="button" className="primaryButton" onClick={onContinue}>
              Continue Local Progress
            </button>
          ) : null}
          <button
            type="button"
            className={hasAutosave ? 'secondaryButton' : 'primaryButton'}
            onClick={onStartNew}
          >
            Start New Tree
          </button>
          <button type="button" className="secondaryButton" onClick={onLoadClick}>
            Load Save File
          </button>
        </div>
      </div>
    </main>
  )
}
