import type { ReactNode } from 'react'

type TierSectionProps = {
  label: string
  children: ReactNode
}

export function TierSection({ label, children }: TierSectionProps) {
  return (
    <section className="tierSection" aria-label={label}>
      {children}
    </section>
  )
}
