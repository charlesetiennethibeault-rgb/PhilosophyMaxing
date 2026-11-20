import { useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'
import { demoItems, renderWheelBitmap } from '../lib/wheelRender'
import { WHEEL_ERAS, type WheelEra } from '../lib/wheelEras'

/** Nombre de parts de la mini-roue (assez pour qu'on reconnaisse la matière et les rayons). */
const THUMB_PARTS: Record<WheelEra, number> = { all: 12, antiquite: 6, 'moyen-age': 6, moderne: 8, xixe: 10, xxe: 5 }

/** Taille des mini-roues : grandes sur ordinateur, un peu plus petites sur téléphone. */
function useThumbSize() {
  const query = '(max-width: 800px)'
  const [small, setSmall] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setSmall(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return small ? 64 : 80
}

function EraThumb({ era, size }: { era: WheelEra; size: number }) {
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
  /** Roue choisie ; `null` si les filtres ne correspondent à aucune roue de la frise. */
  value: WheelEra | null
  /** Philosophies sur chaque roue, selon les autres filtres. */
  counts: Record<WheelEra, number>
  onChange: (era: WheelEra) => void
}

/**
 * « Choisir son époque » : la frise des roues, de la meule de pierre à la jante moderne.
 * Choisir une roue, c'est choisir la période : la grande roue ne contient que ses philosophies.
 */
export default function EraStrip({ value, counts, onChange }: Props) {
  const { t } = useLang()
  const size = useThumbSize()
  const move = (dir: 1 | -1) => {
    const i = value ? WHEEL_ERAS.findIndex((e) => e.id === value) : dir === 1 ? -1 : 0
    const next = WHEEL_ERAS[(i + dir + WHEEL_ERAS.length) % WHEEL_ERAS.length]
    onChange(next.id)
    // le focus suit la sélection
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-era="${next.id}"]`)?.focus())
  }
  return (
    <section className="era-picker" aria-labelledby="era-title">
      <div className="era-head">
        <h2 id="era-title" className="era-title">{t('era.title')}</h2>
        <p className="era-sub">{t('era.sub')}</p>
      </div>
      <div
        className="era-strip" role="radiogroup" aria-labelledby="era-title"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1) }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
        }}
      >
        {WHEEL_ERAS.map((e, i) => (
          <button
            key={e.id} type="button" role="radio" data-era={e.id}
            aria-checked={value === e.id} tabIndex={value === e.id || (value === null && i === 0) ? 0 : -1}
            aria-label={t('era.aria', { label: t(`era.${e.id}.label`), object: t(`era.${e.id}.object`), count: counts[e.id] })}
            className={`era-item${value === e.id ? ' on' : ''}`}
            onClick={() => onChange(e.id)}
          >
            <EraThumb era={e.id} size={size} />
            <span className="era-name">{t(`era.${e.id}.short`)}</span>
            <span className="era-count">{counts[e.id]}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
