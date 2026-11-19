import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { tick } from '../lib/audio'
import type { NoteStatus } from '../lib/types'

export interface WheelItem {
  id: string
  label: string
  color: string
  pattern: number // 0 = uni, 1..8 = motifs discrets
  star?: boolean
  status?: NoteStatus
}

export interface WheelHandle {
  spinTo: (index: number, power?: number) => void
  isSpinning: () => boolean
}

interface Props {
  items: WheelItem[]
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
const INK = '#2b2118'
const PAPER = '#f4ecd8'

function makePattern(ctx: CanvasRenderingContext2D, kind: number): CanvasPattern | null {
  if (kind === 0) return null
  const c = document.createElement('canvas')
  c.width = c.height = 12
  const g = c.getContext('2d')!
  g.strokeStyle = 'rgba(255,255,255,0.28)'
  g.fillStyle = 'rgba(255,255,255,0.28)'
  g.lineWidth = 1.2
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
  }
  switch (kind) {
    case 1: line(0, 6, 12, 6); break // horizontales
    case 2: line(0, 12, 12, 0); break // diagonale /
    case 3: g.beginPath(); g.arc(6, 6, 1.4, 0, TAU); g.fill(); break // points
    case 4: line(0, 12, 12, 0); line(0, 0, 12, 12); break // croisillons
    case 5: line(6, 0, 6, 12); break // verticales
    case 6: line(0, 0, 12, 12); break // diagonale \
    case 7: g.fillRect(4, 4, 4, 4); break // carrés
    case 8: g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(3, 3, 6, 8); g.quadraticCurveTo(9, 13, 12, 8); g.stroke(); break // vagues
  }
  return ctx.createPattern(c, 'repeat')
}

const fsNow = (g: CanvasRenderingContext2D) => parseFloat(/(\d+(?:\.\d+)?)px/.exec(g.font)![1])

function textColorOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? INK : '#fffaf0'
}

const Wheel = forwardRef<WheelHandle, Props>(function Wheel(props, ref) {
  const { items, showLabels, sound, reducedMotion, disabled, ariaLabel, onLive, onStop, onFlick } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const angle = useRef(0)
  const raf = useRef(0)
  const spinning = useRef(false)
  const lastIndex = useRef(-1)
  const patterns = useRef<(CanvasPattern | null)[]>([])
  const pointerRef = useRef<HTMLDivElement>(null)
  const latest = useRef({ items, sound, onLive, onStop, onFlick, disabled, reducedMotion })
  latest.current = { items, sound, onLive, onStop, onFlick, disabled, reducedMotion }

  const indexAtPointer = useCallback(() => {
    const n = latest.current.items.length
    if (!n) return -1
    const a = (((-Math.PI / 2 - angle.current) % TAU) + TAU) % TAU
    return Math.min(n - 1, Math.floor(a / (TAU / n)))
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const g = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const size = canvas.clientWidth
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = canvas.height = Math.round(size * dpr)
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, size, size)
    if (!patterns.current.length) patterns.current = Array.from({ length: 9 }, (_, k) => makePattern(g, k))

    const list = latest.current.items
    const n = list.length
    const cx = size / 2
    const r = size / 2 - 6
    const step = TAU / Math.max(n, 1)

    g.save()
    g.translate(cx, cx)
    g.rotate(angle.current)
    list.forEach((it, i) => {
      const a0 = i * step
      const a1 = a0 + step
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a0, a1); g.closePath()
      g.fillStyle = it.color; g.fill()
      const pat = patterns.current[it.pattern]
      if (pat) { g.fillStyle = pat; g.fill() }
      g.lineWidth = n > 40 ? 0.6 : 1.5
      g.strokeStyle = PAPER; g.stroke()

      if (showLabels) {
        g.save()
        g.rotate(a0 + step / 2)
        g.fillStyle = textColorOn(it.color)
        const fs = Math.max(10, Math.min(15, size / 28))
        g.font = `600 ${fs}px "Source Serif 4", Georgia, serif`
        g.textAlign = 'right'; g.textBaseline = 'middle'
        let label = (it.star ? '★ ' : '') + it.label
        const maxW = r - 30 - size * 0.055 - 8
        while (g.measureText(label).width > maxW && label.length > 4) {
          if (fsNow(g) > 9) g.font = g.font.replace(/(\d+(?:\.\d+)?)px/, (_, v) => `${Math.max(9, parseFloat(v) - 1)}px`)
          else label = label.slice(0, -2).trimEnd() + '…'
        }
        g.fillText(label, r - 30, 0)
        g.restore()
        // pastille d'état près du bord
        g.save()
        g.rotate(a0 + step / 2)
        const px = r - 14
        g.beginPath(); g.arc(px, 0, 6, 0, TAU)
        g.fillStyle = it.status === 'deep' ? '#fffaf0' : 'rgba(255,250,240,0.18)'
        g.fill()
        g.lineWidth = 1.5; g.strokeStyle = '#fffaf0'; g.stroke()
        if (it.status === 'draft') {
          g.beginPath(); g.arc(px, 0, 6, -Math.PI / 2, Math.PI / 2); g.closePath()
          g.fillStyle = '#fffaf0'; g.fill()
        } else if (it.status === 'deep') {
          g.strokeStyle = it.color; g.lineWidth = 2
          g.beginPath(); g.moveTo(px - 3, 0); g.lineTo(px - 0.5, 3); g.lineTo(px + 3.5, -3); g.stroke()
        }
        g.restore()
      }
    })
    g.restore()

    // bord et moyeu
    g.beginPath(); g.arc(cx, cx, r, 0, TAU); g.lineWidth = 3; g.strokeStyle = INK; g.stroke()
    g.beginPath(); g.arc(cx, cx, size * 0.055, 0, TAU)
    g.fillStyle = PAPER; g.fill(); g.lineWidth = 2; g.stroke()
  }, [showLabels])

  useEffect(() => {
    draw()
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(draw)
    ro.observe(box)
    return () => ro.disconnect()
  }, [draw, items])

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

  useEffect(() => { notifyLive(); draw() }, [items, notifyLive, draw])

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
