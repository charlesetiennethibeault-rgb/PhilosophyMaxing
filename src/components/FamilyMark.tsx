import type { ReactElement } from 'react'

/** Repère de famille : forme géométrique SVG (9 formes), toujours écrit avec le nom de la famille. */
const SHAPES: ((c: string) => ReactElement)[] = [
  (c) => <circle cx="8" cy="8" r="6" fill={c} />,
  (c) => <rect x="2.5" y="2.5" width="11" height="11" fill={c} />,
  (c) => <path d="M8 2 L14.5 13.5 H1.5 Z" fill={c} />,
  (c) => <path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" fill={c} />,
  (c) => <path d="M8 1.5 L13.7 4.75 V11.25 L8 14.5 L2.3 11.25 V4.75 Z" fill={c} />,
  (c) => <path d="M6 2 H10 V6 H14 V10 H10 V14 H6 V10 H2 V6 H6 Z" fill={c} />,
  (c) => <path d="M2 8 A6 6 0 0 1 14 8 Z" fill={c} />,
  (c) => <path d="M8 1 C8.6 5.2 10.8 7.4 15 8 C10.8 8.6 8.6 10.8 8 15 C7.4 10.8 5.2 8.6 1 8 C5.2 7.4 7.4 5.2 8 1 Z" fill={c} />,
  (c) => <path d="M8 8 C8 3 3 3 3 5.8 C3 8 8 8 8 8 C13 8 13 3 10.2 3 C8 3 8 8 8 8 C8 13 13 13 13 10.2 C13 8 8 8 8 8 C3 8 3 13 5.8 13 C8 13 8 8 8 8 Z" fill={c} />,
]

export default function FamilyMark({ index, color, size = 16 }: { index: number; color: string; size?: number }) {
  return (
    <svg className="family-mark" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {SHAPES[index % SHAPES.length](color)}
    </svg>
  )
}
