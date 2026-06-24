import type { IconKey } from '../domain/types'

type IconEmblemProps = {
  iconKey: IconKey | 'living'
}

export function IconEmblem({ iconKey }: IconEmblemProps) {
  return (
    <svg className="nodeIcon" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="36" className="iconHalo" />
      {renderIcon(iconKey)}
    </svg>
  )
}

function renderIcon(iconKey: IconKey | 'living') {
  switch (iconKey) {
    case 'gaze':
      return (
        <>
          <path d="M13 50C24 32 39 25 50 25s26 7 37 25c-11 18-26 25-37 25S24 68 13 50Z" />
          <circle cx="50" cy="50" r="12" />
          <circle cx="50" cy="50" r="4" className="iconCut" />
        </>
      )
    case 'flight':
      return (
        <>
          <path d="M50 18 30 70l20-12 20 12Z" />
          <path d="M24 44 10 62l25-6M76 44l14 18-25-6" />
        </>
      )
    case 'stormlight':
      return <path d="M57 8 25 52h20l-8 40 36-50H51Z" />
    case 'denial':
      return (
        <>
          <path d="M50 12 78 24v22c0 19-11 32-28 42-17-10-28-23-28-42V24Z" />
          <path d="M35 50h30M50 33v34" className="iconCut" />
        </>
      )
    case 'anchor':
      return (
        <>
          <circle cx="50" cy="22" r="10" />
          <path d="M50 32v48M28 44h44M24 65c8 14 18 20 26 20s18-6 26-20M34 75l-12-5M66 75l12-5" />
        </>
      )
    case 'impossible':
      return (
        <>
          <path d="M22 70c18-45 38-45 56 0" />
          <path d="M78 30c-18 45-38 45-56 0" />
          <path d="M31 31h18v18H31ZM51 51h18v18H51Z" />
        </>
      )
    case 'kinetic':
      return (
        <>
          <circle cx="50" cy="50" r="9" />
          <path d="M50 7v24M50 69v24M7 50h24M69 50h24M20 20l17 17M63 63l17 17M80 20 63 37M37 63 20 80" />
        </>
      )
    case 'worldbreaker':
      return (
        <>
          <path d="M50 12 30 45h15L32 88l38-51H54Z" />
          <path d="M20 75h60M26 62h48" />
        </>
      )
    case 'muscle':
      return (
        <>
          <path d="M33 64c-10-5-11-19-3-27 5-5 14-6 20 0 8-8 24-3 24 11 0 18-25 34-25 34S41 68 33 64Z" />
          <path d="M30 49h40" className="iconCut" />
        </>
      )
    case 'predator':
      return (
        <>
          <path d="M22 70c8-31 19-46 28-46s20 15 28 46c-11-10-20-13-28-13s-17 3-28 13Z" />
          <path d="M34 48h10M56 48h10M42 67l8 10 8-10" className="iconCut" />
        </>
      )
    case 'breakline':
      return (
        <>
          <path d="M10 35h34l-9-16M90 65H56l9 16M18 64c22-14 42-16 64-28" />
          <path d="M23 74c18-9 32-11 54-10" />
        </>
      )
    case 'crown':
      return (
        <>
          <path d="M20 72h60l5-42-21 19-14-28-14 28-21-19Z" />
          <path d="M24 82h52" />
        </>
      )
    case 'stance':
      return (
        <>
          <path d="M50 14v72M30 86h40M22 66h56M50 46c-14 0-22-8-24-22 12 1 20 8 24 22Zm0 0c14 0 22-8 24-22-12 1-20 8-24 22Z" />
        </>
      )
    case 'gaia':
      return (
        <>
          <path d="M50 84V43" />
          <path d="M50 45c-15 0-28-10-30-27 17 2 27 12 30 27Zm0 0c15 0 28-10 30-27-17 2-27 12-30 27Z" />
          <path d="M28 84c8-16 36-16 44 0" />
        </>
      )
    case 'law':
      return (
        <>
          <path d="M50 14v72M25 30h50M32 30 18 58h28Zm36 0L54 58h28Z" />
          <path d="M20 68h24M56 68h24" />
        </>
      )
    case 'calamity':
      return (
        <>
          <path d="M50 8 61 38l31 3-24 20 7 31-25-17-25 17 7-31L8 41l31-3Z" />
          <circle cx="50" cy="50" r="13" className="iconCut" />
        </>
      )
    case 'momentum':
      return (
        <>
          <path d="M20 55c0-24 27-40 48-25l9-13 6 35-35-6 13-8c-12-6-27 3-27 17 0 11 9 20 20 20 8 0 15-5 18-12" />
        </>
      )
    case 'solar':
      return (
        <>
          <circle cx="50" cy="50" r="18" />
          <path d="M50 5v20M50 75v20M5 50h20M75 50h20M18 18l14 14M68 68l14 14M82 18 68 32M32 68 18 82" />
        </>
      )
    case 'mandate':
      return (
        <>
          <path d="M32 76c-12-7-13-26-2-36l8-8 15 14-8 8c-3 3-2 9 2 11l5 3c4 2 10 1 13-2l10-10 14 14-10 10c-9 9-23 12-35 6Z" />
          <path d="M41 23 77 59" />
        </>
      )
    case 'convergence':
      return (
        <>
          <circle cx="50" cy="50" r="24" />
          <circle cx="50" cy="50" r="8" />
          <path d="M50 6v20M50 74v20M6 50h20M74 50h20M18 18l14 14M68 68l14 14M82 18 68 32M32 68 18 82" />
        </>
      )
    case 'living':
      return (
        <>
          <circle cx="50" cy="50" r="21" />
          <path d="M50 2v34M50 64v34M2 50h34M64 50h34M20 20l22 22M58 58l22 22M80 20 58 42M42 58 20 80" />
          <circle cx="50" cy="50" r="5" className="iconCut" />
        </>
      )
  }
}
