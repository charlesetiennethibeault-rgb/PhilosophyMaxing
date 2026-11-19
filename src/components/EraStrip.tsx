import { useEffect, useRef } from 'react'
import { demoItems, renderWheelBitmap } from '../lib/wheelRender'
import { WHEEL_ERAS, type WheelEra } from '../lib/wheelEras'

/** Nombre de parts de la mini-roue (assez pour qu'on reconnaisse la matière et les rayons). */
const THUMB_PARTS: Record<WheelEra, number> = { all: 12, antiquite: 6, 'moyen-age': 6, moderne: 8, xixe: 10, xxe: 5 }

function EraThumb({ era, size = 56 }: { era: WheelEra; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.height = Math.round(size * dpr)
    const g = canvas.getContext('2d')!
    g.clearRect(0, 0, canvas.width, canvas.height)
    g.drawImage(renderWheelBitmap({ era, items: demoItems(THUMB_PARTS[era]), size, dpr, showLabels: false }), 0, 0)
  }, [era, size])
  return <canvas ref={ref} className="era-thumb" width={size} height={size} style={{ width: size, height: size }} aria-hidden="true" />
}

interface Props {
  value: WheelEra
  /** Philosophies sur chaque roue, selon les autres filtres. */
  counts: Record<WheelEra, number>
  onChange: (era: WheelEra) => void
}

/**
 * La frise des roues : de la meule de pierre à la jante moderne, comme alignées sur un muret.
 * Choisir une roue, c'est choisir la période : la grande roue ne contient que ses philosophies.
 */
export default function EraStrip({ value, counts, onChange }: Props) {
  const move = (dir: 1 | -1) => {
    const i = WHEEL_ERAS.findIndex((e) => e.id === value)
    const next = WHEEL_ERAS[(i + dir + WHEEL_ERAS.length) % WHEEL_ERAS.length]
    onChange(next.id)
    // le focus suit la sélection
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-era="${next.id}"]`)?.focus())
  }
  return (
    <div
      className="era-strip" role="radiogroup" aria-label="Roue de la période"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1) }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
      }}
    >
      {WHEEL_ERAS.map((e) => (
        <button
          key={e.id} type="button" role="radio" data-era={e.id}
          aria-checked={value === e.id} tabIndex={value === e.id ? 0 : -1}
          aria-label={`${e.label} : ${e.object}, ${counts[e.id]} philosophie${counts[e.id] > 1 ? 's' : ''}`}
          className={`era-item${value === e.id ? ' on' : ''}`}
          onClick={() => onChange(e.id)}
        >
          <EraThumb era={e.id} />
          <span className="era-name">{e.short}</span>
          <span className="era-count">{counts[e.id]}</span>
        </button>
      ))}
    </div>
  )
}
