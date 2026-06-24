import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import clsx from 'clsx'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  }
>(function Button({ className, variant = 'secondary', ...props }, ref) {
  return <button ref={ref} className={clsx('button', `button-${variant}`, className)} {...props} />
})

export function LinkButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className={clsx('link-button', className)} {...props}>
      {children}
    </button>
  )
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: 'neutral' | 'good' | 'warning' | 'danger' | 'gold'
}) {
  return (
    <section className={clsx('stat-card', `tone-${tone}`)}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </section>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function TextArea(props: InputHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input textarea" {...props} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="error-message" role="alert">
      {message}
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </section>
  )
}

export function stateLabel(state: string): string {
  if (state === 'fully-realized') return 'Fully Realized'
  if (state === 'requirements-in-progress') return 'Requirements in progress'
  if (state === 'mechanically-available') return 'Mechanically available'
  if (state === 'narratively-revealed') return 'Narratively revealed'
  return state
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatDate(value?: string): string {
  if (!value) return 'Not recorded'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx('panel', className)}>{children}</section>
}
