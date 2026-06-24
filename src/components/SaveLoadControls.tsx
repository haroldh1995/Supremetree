import { useRef } from 'react'

type SaveLoadControlsProps = {
  busy: boolean
  onSave: () => void
  onLoadText: (text: string) => void
  onReset: () => void
  error?: string
}

export function SaveLoadControls({
  busy,
  onSave,
  onLoadText,
  onReset,
  error,
}: SaveLoadControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = () => {
    const file = inputRef.current?.files?.[0]
    if (!file) {
      return
    }
    void file.text().then(onLoadText)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <section className="saveLoadControls" aria-label="Save and load progress">
      <button type="button" className="smallButton" onClick={onSave} disabled={busy}>
        Save Progress
      </button>
      <button
        type="button"
        className="smallButton"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        Load Progress
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="srOnly"
        onChange={handleFileChange}
        aria-label="Choose Dumare progress save file"
      />
      <button
        type="button"
        className="smallButton dangerTextButton"
        onClick={onReset}
        disabled={busy}
      >
        Reset Progress
      </button>
      {error ? <p className="inlineError">{error}</p> : null}
    </section>
  )
}
