type ManifestButtonProps = {
  disabled: boolean
  eligibleCount: number
  onManifest: () => void
}

export function ManifestButton({ disabled, eligibleCount, onManifest }: ManifestButtonProps) {
  return (
    <button
      className="manifestButton"
      disabled={disabled}
      onClick={onManifest}
      type="button"
      aria-describedby="manifest-help"
    >
      <span>Manifest</span>
      <small>{eligibleCount} eligible</small>
    </button>
  )
}
