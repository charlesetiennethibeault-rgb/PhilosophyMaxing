import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { tick } from '../lib/audio'
import { renderWheelBitmap, type WheelItem } from '../lib/wheelRender'
import type { WheelEra } from '../lib/wheelEras'

export type { WheelItem }

export interface WheelHandle {
  spinTo: (index: number, power?: number) => void
  isSpinning: () => boolean
}

interface Props {
  items: WheelItem[]
  /** La roue de la période : meule de pierre, roue de bois, charrette, rayons de fer, pneu… */
  era: WheelEra
  showLabels?: boolean
  sound: boolean
  reducedMotion: boolean
  disabled?: boolean
  ariaLabel: string
  onLive: (index: number) => void
  onStop: (index: number) => void
  /** Lancer au doigt ou à la souris : le parent choisit le résultat puis appelle spinTo. */
  onFlick: (power: number) => void
}

const TAU = Math.PI * 2

const Wheel = forwardRef<WheelHandle, Props>(function Wheel(props, ref) {
  const { items, era, showLabels, sound, reducedMotion, disabled, ariaLabel, onLive, onStop, onFlick } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const angle = useRef(0)
  const raf = useRef(0)
  const spinning = useRef(false)
  const lastIndex = useRef(-1)
  const pointerRef = useRef<HTMLDivElement>(null)
  const bitmap = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(null)
  const latest = useRef({ items, era, sound, onLive, onStop, onFlick, disabled, reducedMotion })
  latest.current = { items, era, sound, onLive, onStop, onFlick, disabled, reducedMotion }

  const indexAtPointer = useCallback(() => {
    const n = latest.current.items.length
    if (!n) return -1
    const a = (((-Math.PI / 2 - angle.current) % TAU) + TAU) % TAU
    return Math.min(n - 1, Math.floor(a / (TAU / n)))
  }, [])

  /** La roue est dessinée une fois (matière, rayons, jante) puis seulement tournée à chaque image. */
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const g = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const size = canvas.clientWidth
    if (!size) return
    if (canvas.width !== Math.round(size * dpr)) canvas.width = canvas.height = Math.round(size * dpr)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, size, size)

    const { items: list, era: e } = latest.current
    const key = `${e}|${Math.round(size * dpr)}|${showLabels ? 1 : 0}|${list.map((i) => `${i.id}:${i.color}:${i.status ?? ''}:${i.star ? 1 : 0}:${i.label}`).join(',')}`
    if (bitmap.current?.key !== key) {
      bitmap.current = { key, canvas: renderWheelBitmap({ era: e, items: list, size, dpr, showLabels: !!showLabels }) }
    }
    g.save()
    g.translate(size / 2, size / 2)
    g.rotate(angle.current)
    g.drawImage(bitmap.current.canvas, -size / 2, -size / 2, size, size)
    g.restore()
  }, [showLabels])

  useEffect(() => {
    draw()
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(draw)
    ro.observe(box)
    return () => ro.disconnect()
  }, [draw, items, era])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const notifyLive = useCallback(() => {
    const i = indexAtPointer()
    if (i !== lastIndex.current) {
      lastIndex.current = i
      latest.current.onLive(i)
      if (spinning.current && latest.current.sound) tick()
      const el = pointerRef.current
      if (spinning.current && el && !latest.current.reducedMotion) {
        el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick') // petite secousse du pointeur
      }
    }
  }, [indexAtPointer])

  useEffect(() => { notifyLive(); draw() }, [items, era, notifyLive, draw])

  useImperativeHandle(ref, () => ({
    isSpinning: () => spinning.current,
    spinTo(index, power = 0.6) {
      const n = latest.current.items.length
      if (!n || spinning.current) return
      const step = TAU / n
      const jitter = (Math.random() - 0.5) * 0.7
      const target = -Math.PI / 2 - (index + 0.5 + jitter) * step
      const delta = ((((target - angle.current) % TAU) + TAU) % TAU)
      const turns = reducedMotion ? 0 : 3 + Math.round(power * 4)
      const total = delta + turns * TAU
      const duration = reducedMotion ? 450 : 3200 + power * 3000
      const from = angle.current
      const t0 = performance.now()
      spinning.current = true
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / duration)
        const eased = 1 - Math.pow(1 - t, 4)
        angle.current = from + total * eased
        draw()
        notifyLive()
        if (t < 1) raf.current = requestAnimationFrame(frame)
        else {
          spinning.current = false
          latest.current.onStop(indexAtPointer())
        }
      }
      raf.current = requestAnimationFrame(frame)
    },
  }), [draw, indexAtPointer, notifyLive, reducedMotion])

  // Glisser pour lancer
  const drag = useRef<{ last: number; samples: { t: number; a: number }[] } | null>(null)
  const pointerAngle = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return Math.atan2(e.clientY - rect.top - rect.height / 2, e.clientX - rect.left - rect.width / 2)
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if (spinning.current || latest.current.disabled) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const a = pointerAngle(e)
    drag.current = { last: a, samples: [{ t: performance.now(), a: 0 }] }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const a = pointerAngle(e)
    let da = a - d.last
    if (da > Math.PI) da -= TAU
    if (da < -Math.PI) da += TAU
    d.last = a
    angle.current += da
    const prev = d.samples[d.samples.length - 1]
    d.samples.push({ t: performance.now(), a: prev.a + da })
    draw(); notifyLive()
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d || d.samples.length < 2) return
    const now = performance.now()
    const recent = d.samples.filter((s) => now - s.t < 150)
    if (recent.length < 2) return
    const first = recent[0]; const last = recent[recent.length - 1]
    const speed = Math.abs(last.a - first.a) / Math.max(1, last.t - first.t) // rad/ms
    if (speed > 0.002) latest.current.onFlick(Math.min(1, speed / 0.012))
  }
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !spinning.current && !latest.current.disabled) {
      e.preventDefault(); latest.current.onFlick(0.6)
    }
  }

  return (
    <div className="wheel-box" ref={boxRef}>
      <div className="wheel-pointer" ref={pointerRef} aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="wheel-canvas"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKey}
      />
    </div>
  )
})

export default Wheel
