type TierPlaqueProps = {
  title: string
  subtitle: string
  y: number
}

export function TierPlaque({ title, subtitle, y }: TierPlaqueProps) {
  return (
    <aside className="tierPlaque" style={{ top: `${(y / 1280) * 100}%` }}>
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </aside>
  )
}
