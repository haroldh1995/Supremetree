import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './common'

export function AccessibleDialog({
  open,
  title,
  children,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: (this: void) => void
  onConfirm: (this: void) => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>
        <div>{children}</div>
        <div className="action-row">
          <Button ref={closeRef} type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </section>
    </div>
  )
}
