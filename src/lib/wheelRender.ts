import type { NoteStatus } from './types'
import type { WheelEra } from './wheelEras'
import { ON_BRAND, SURFACE, TEXT } from './ui'

/** Dessin des roues par période (design.md §13). Le résultat est un bitmap : la roue ne fait ensuite que tourner. */

export interface WheelItem {
  id: string
  label: string
  color: string
  star?: boolean
  status?: NoteStatus
}

export interface RenderOptions {
  era: WheelEra
  items: WheelItem[]
  /** Côté en pixels CSS. */
  size: number
  dpr: number
  /** Écrit le nom des parts et leur pastille d'état (roue des sujets). */
  showLabels: boolean
}

const TAU = Math.PI * 2

/** Matières des roues : valeurs de contenu (illustration), décrites dans design.md §13. */
const M = {
  stone: { base: '#B5AEA0', dark: '#6C655A', light: '#E4DDCF', hole: '#26231F' },
  wood: { base: '#9A6A3A', dark: '#5B3A1E', light: '#C28F58', grain: '#4A2E16' },
  iron: { base: '#4A4F56', dark: '#23262A', light: '#B9BFC6' },
  steel: { base: '#8A9098', light: '#D7DBE0', dark: '#3B3F45' },
  rubber: { base: '#1C1E21', mid: '#2E3136', light: '#44484E' },
  alloy: { base: '#C4C9CF', light: '#F1F3F5', dark: '#7A8087' },
}

/** Générateur pseudo-aléatoire reproductible : la même roue a toujours les mêmes aspérités. */
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function textColorOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.55 ? TEXT : ON_BRAND
}

type G = CanvasRenderingContext2D

function sector(g: G, a0: number, a1: number, rIn: number, rOut: number) {
  g.beginPath()
  g.arc(0, 0, rOut, a0, a1)
  if (rIn > 0) g.arc(0, 0, rIn, a1, a0, true)
  else g.lineTo(0, 0)
  g.closePath()
}

function disc(g: G, r: number, fill: string) {
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = fill; g.fill()
}

function ring(g: G, rIn: number, rOut: number, fill: string) {
  g.beginPath(); g.arc(0, 0, rOut, 0, TAU); g.arc(0, 0, rIn, 0, TAU, true); g.fillStyle = fill; g.fill()
}

function circleStroke(g: G, r: number, color: string, w: number, alpha = 1) {
  g.save(); g.globalAlpha = alpha; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.lineWidth = w; g.strokeStyle = color; g.stroke(); g.restore()
}

/** Les parts : couleur de la famille entre `rIn` et `rOut`, avec une opacité (la matière transparaît). */
function faceSlices(g: G, items: WheelItem[], rIn: number, rOut: number, alpha: number) {
  const step = TAU / Math.max(items.length, 1)
  items.forEach((it, i) => {
    sector(g, i * step, (i + 1) * step, rIn, rOut)
    g.save(); g.globalAlpha = alpha; g.fillStyle = it.color; g.fill(); g.restore()
  })
}

/** Rayon effilé (largeur w0 au moyeu, w1 à la jante) le long de l'angle `a`. */
function spoke(g: G, a: number, r0: number, w0: number, r1: number, w1: number, fill: string, edge?: string, highlight?: string) {
  g.save(); g.rotate(a)
  g.beginPath(); g.moveTo(r0, -w0 / 2); g.lineTo(r1, -w1 / 2); g.lineTo(r1, w1 / 2); g.lineTo(r0, w0 / 2); g.closePath()
  g.fillStyle = fill; g.fill()
  if (edge) { g.lineWidth = 1; g.strokeStyle = edge; g.stroke() }
  if (highlight) { g.beginPath(); g.moveTo(r0, -w0 / 4); g.lineTo(r1, -w1 / 4); g.lineWidth = 1; g.strokeStyle = highlight; g.globalAlpha = 0.6; g.stroke() }
  g.restore()
}

function boundaries(n: number, fn: (a: number, i: number) => void) {
  const step = TAU / Math.max(n, 1)
  for (let i = 0; i < n; i++) fn(i * step, i)
}

function roughPath(g: G, r: number, rand: () => number, jitter: number) {
  const n = 220
  g.beginPath()
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * TAU
    const rr = r - jitter * rand() - Math.sin(a * 7) * jitter * 0.5
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  g.closePath()
}

/* ---------- les parts écrites (roue des sujets) ---------- */

function labels(g: G, items: WheelItem[], rText: number, rDot: number, hubR: number, size: number) {
  const step = TAU / Math.max(items.length, 1)
  items.forEach((it, i) => {
    const ink = textColorOn(it.color)
    g.save(); g.rotate(i * step + step / 2)
    g.fillStyle = ink
    let fs = Math.max(10, Math.min(15, size / 28))
    g.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif`
    g.textAlign = 'right'; g.textBaseline = 'middle'
    let text = it.label
    const starRoom = it.star ? 16 : 0
    const maxW = rText - hubR - 8 - starRoom
    while (g.measureText(text).width > maxW && text.length > 4) {
      if (fs > 9) { fs -= 1; g.font = `600 ${fs}px "IBM Plex Sans", system-ui, sans-serif` } else text = text.slice(0, -2).trimEnd() + '…'
    }
    g.fillText(text, rText, 0)
    if (it.star) {
      const cx = rText - g.measureText(text).width - 9
      g.beginPath()
      for (let k = 0; k < 10; k++) {
        const rad = k % 2 === 0 ? 6 : 2.6
        const ang = -Math.PI / 2 + (k * Math.PI) / 5
        g.lineTo(cx + Math.cos(ang) * rad, Math.sin(ang) * rad)
      }
      g.closePath(); g.fill()
    }
    // pastille d'état : vide, demi-remplie (brouillon) ou cochée (approfondi)
    g.beginPath(); g.arc(rDot, 0, 6, 0, TAU)
    g.fillStyle = it.status === 'deep' ? ink : 'transparent'; g.fill()
    g.lineWidth = 1.5; g.strokeStyle = ink; g.stroke()
    if (it.status === 'draft') {
      g.beginPath(); g.arc(rDot, 0, 6, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fillStyle = ink; g.fill()
    } else if (it.status === 'deep') {
      g.strokeStyle = it.color; g.lineWidth = 2
      g.beginPath(); g.moveTo(rDot - 3, 0); g.lineTo(rDot - 0.5, 3); g.lineTo(rDot + 3.5, -3); g.stroke()
    }
    g.restore()
  })
}

/* ---------- les cinq roues ---------- */

interface Geo { R: number; faceR: number; hubR: number }

/** Antiquité : une meule de pierre piquetée, percée en son centre. */
function stoneWheel(g: G, o: RenderOptions, R: number): Geo {
  const rand = mulberry(11)
  const hubR = R * 0.075
  g.save()
  roughPath(g, R * 0.985, rand, 3); g.clip()
  disc(g, R, M.stone.base)
  faceSlices(g, o.items, hubR, R, 0.5)
  // marbrures : grandes taches douces, claires et sombres
  for (let k = 0; k < 70; k++) {
    const a = rand() * TAU, r = Math.sqrt(rand()) * R, s = R * (0.05 + rand() * 0.12)
    g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, s, 0, TAU)
    g.fillStyle = rand() > 0.5 ? M.stone.light : M.stone.dark; g.globalAlpha = 0.05 + rand() * 0.06; g.fill()
  }
  g.globalAlpha = 1
  // grain de la pierre
  for (let k = 0; k < 4800; k++) {
    const a = rand() * TAU, r = Math.sqrt(rand()) * R
    g.fillStyle = rand() > 0.5 ? M.stone.light : M.stone.dark
    g.globalAlpha = 0.14 + rand() * 0.18
    g.fillRect(Math.cos(a) * r, Math.sin(a) * r, 1.6, 1.6)
  }
  g.globalAlpha = 1
  // piqûres
  for (let k = 0; k < 230; k++) {
    const a = rand() * TAU, r = (0.14 + rand() * 0.8) * R, s = 1.2 + rand() * 5
    const x = Math.cos(a) * r, y = Math.sin(a) * r
    g.beginPath(); g.ellipse(x, y, s, s * 0.8, rand() * 3, 0, TAU); g.fillStyle = M.stone.dark; g.globalAlpha = 0.55; g.fill()
    g.beginPath(); g.arc(x + 0.5, y + 0.8, s * 0.9, 0.2, Math.PI - 0.2); g.strokeStyle = M.stone.light; g.globalAlpha = 0.5; g.lineWidth = 1; g.stroke()
  }
  g.globalAlpha = 1
  // sillons taillés entre les parts
  boundaries(o.items.length, (a) => {
    g.save(); g.rotate(a)
    g.beginPath(); g.moveTo(hubR, 0); g.lineTo(R, 0); g.lineWidth = 2; g.strokeStyle = M.stone.dark; g.stroke()
    g.beginPath(); g.moveTo(hubR, 1.6); g.lineTo(R, 1.6); g.lineWidth = 1; g.strokeStyle = M.stone.light; g.globalAlpha = 0.55; g.stroke()
    g.restore()
  })
  g.restore()
  circleStroke(g, R * 0.975, M.stone.dark, 3, 0.7)
  // trou central
  disc(g, hubR * 1.35, M.stone.dark)
  disc(g, hubR, M.stone.hole)
  circleStroke(g, hubR * 1.1, M.stone.light, 1.2, 0.6)
  return { R, faceR: R * 0.97, hubR: hubR * 1.35 }
}

/** Moyen Âge : une roue pleine de planches, avec ses traverses clouées et son trou carré. */
function plankWheel(g: G, o: RenderOptions, R: number): Geo {
  const rand = mulberry(23)
  const hubR = R * 0.1
  g.save()
  g.beginPath(); g.arc(0, 0, R * 0.985, 0, TAU); g.clip()
  disc(g, R, M.wood.base)
  faceSlices(g, o.items, hubR, R * 0.985, 0.62)
  // fil du bois : traits verticaux ondulés
  for (let x = -R; x < R; x += 4) {
    g.beginPath()
    const phase = rand() * 6
    for (let y = -R; y <= R; y += 12) g.lineTo(x + Math.sin(y * 0.04 + phase) * 1.8, y)
    g.strokeStyle = M.wood.grain; g.globalAlpha = 0.1 + rand() * 0.16; g.lineWidth = 1; g.stroke()
  }
  g.globalAlpha = 1
  // joints entre les planches
  for (const x of [-R * 0.34, R * 0.34]) {
    g.beginPath(); g.moveTo(x, -R); g.lineTo(x, R); g.lineWidth = 3; g.strokeStyle = M.wood.dark; g.stroke()
    g.beginPath(); g.moveTo(x + 2.5, -R); g.lineTo(x + 2.5, R); g.lineWidth = 1; g.strokeStyle = M.wood.light; g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1
  }
  // séparation des parts
  boundaries(o.items.length, (a) => {
    g.save(); g.rotate(a); g.beginPath(); g.moveTo(hubR, 0); g.lineTo(R, 0); g.lineWidth = 1.6; g.strokeStyle = M.wood.dark; g.globalAlpha = 0.65; g.stroke(); g.restore()
  })
  // traverses clouées
  for (const x of [-R * 0.62, R * 0.62]) {
    g.fillStyle = M.wood.dark; g.globalAlpha = 0.75; g.fillRect(x - R * 0.05, -R, R * 0.1, R * 2)
    g.globalAlpha = 1; g.fillStyle = M.iron.base
    for (let y = -R * 0.8; y <= R * 0.8; y += R * 0.2) { g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill() }
  }
  g.restore()
  circleStroke(g, R * 0.975, M.wood.dark, 3.5, 0.9)
  // trou d'essieu carré
  g.fillStyle = M.wood.dark; g.fillRect(-hubR * 0.62, -hubR * 0.62, hubR * 1.24, hubR * 1.24)
  g.fillStyle = M.wood.grain; g.fillRect(-hubR * 0.45, -hubR * 0.45, hubR * 0.9, hubR * 0.9)
  return { R, faceR: R * 0.96, hubR: hubR * 0.9 }
}

/** Époque moderne : roue de charrette en bois, jante cerclée de fer, moyeu massif. */
function cartWheel(g: G, o: RenderOptions, R: number): Geo {
  const rand = mulberry(37)
  const tireIn = R * 0.955, felloeIn = R * 0.86, hubR = R * 0.13
  faceSlices(g, o.items, hubR, felloeIn, 0.92)
  // jante en bois, avec ses joints
  ring(g, felloeIn, tireIn, M.wood.base)
  for (let k = 0; k < 240; k++) {
    const a = rand() * TAU, r = felloeIn + rand() * (tireIn - felloeIn)
    g.beginPath(); g.moveTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(Math.cos(a + 0.05) * r, Math.sin(a + 0.05) * r)
    g.strokeStyle = M.wood.grain; g.globalAlpha = 0.25; g.lineWidth = 1; g.stroke()
  }
  g.globalAlpha = 1
  boundaries(o.items.length, (a) => {
    g.save(); g.rotate(a); g.beginPath(); g.moveTo(felloeIn, 0); g.lineTo(tireIn, 0); g.lineWidth = 1.5; g.strokeStyle = M.wood.dark; g.stroke(); g.restore()
  })
  circleStroke(g, felloeIn, M.wood.dark, 1.5)
  // cerclage de fer
  ring(g, tireIn, R, M.iron.base)
  circleStroke(g, R - 1.5, M.iron.light, 1.2, 0.55)
  circleStroke(g, tireIn + 1, M.iron.dark, 1.5)
  // rayons de bois
  boundaries(o.items.length, (a) => spoke(g, a, hubR * 0.9, R * 0.05, felloeIn, R * 0.03, M.wood.base, M.wood.dark, M.wood.light))
  // moyeu
  disc(g, hubR, M.wood.base); circleStroke(g, hubR, M.wood.dark, 2)
  circleStroke(g, hubR * 0.62, M.iron.base, 4); circleStroke(g, hubR * 0.62, M.iron.light, 1, 0.5)
  disc(g, hubR * 0.28, M.wood.dark)
  return { R, faceR: felloeIn, hubR }
}

/** XIXe siècle : roue à rayons de fer fins, jante d'acier. */
function ironWheel(g: G, o: RenderOptions, R: number): Geo {
  const rimIn = R * 0.925, hubR = R * 0.09
  faceSlices(g, o.items, hubR, rimIn, 0.85)
  ring(g, rimIn, R, M.iron.base)
  ring(g, rimIn + 3, R - 3, M.steel.base)
  circleStroke(g, R - 1.5, M.steel.light, 1.4, 0.8)
  circleStroke(g, rimIn + 1, M.iron.dark, 2, 0.9)
  // rivets de la jante
  for (let a = 0; a < TAU; a += TAU / 48) {
    g.beginPath(); g.arc(Math.cos(a) * (R * 0.962), Math.sin(a) * (R * 0.962), 1.6, 0, TAU); g.fillStyle = M.steel.dark; g.fill()
  }
  const n = o.items.length
  // rayons tangents, comme sur une roue de vélo ancienne
  boundaries(n, (a) => {
    const step = TAU / Math.max(n, 1)
    for (const side of [-1, 1]) {
      for (const [hubA, rimA, w] of [[0.6, 0.09, 1.1], [1.1, 0.18, 0.9]] as const) {
        g.beginPath()
        g.moveTo(Math.cos(a + side * hubA) * hubR * 0.95, Math.sin(a + side * hubA) * hubR * 0.95)
        g.lineTo(Math.cos(a + side * step * rimA) * rimIn, Math.sin(a + side * step * rimA) * rimIn)
        g.lineWidth = w + 1; g.strokeStyle = M.iron.dark; g.globalAlpha = 0.45; g.stroke()
        g.lineWidth = w; g.strokeStyle = M.steel.light; g.globalAlpha = 0.85; g.stroke(); g.globalAlpha = 1
      }
    }
    spoke(g, a, hubR * 0.9, 3.2, rimIn, 1.8, M.steel.light, M.steel.dark)
  })
  disc(g, hubR * 1.15, M.steel.dark); disc(g, hubR, M.steel.base)
  circleStroke(g, hubR, M.steel.light, 1.2, 0.8)
  disc(g, hubR * 0.4, M.steel.dark)
  return { R, faceR: rimIn, hubR: hubR * 1.15 }
}

/** XXe–XXIe siècles : pneu strié sur une jante d'alliage, rayons larges, enjoliveur à cinq écrous. */
function modernWheel(g: G, o: RenderOptions, R: number): Geo {
  const rand = mulberry(53)
  const tireIn = R * 0.84, rimIn = R * 0.795, hubR = R * 0.11
  faceSlices(g, o.items, hubR, rimIn, 0.92)
  // pneu
  ring(g, tireIn, R, M.rubber.base)
  for (let a = 0; a < TAU; a += 0.065) {
    g.save(); g.rotate(a + rand() * 0.01)
    g.beginPath(); g.moveTo(R * 0.965, 0); g.lineTo(R * 0.995, 0); g.lineWidth = 2; g.strokeStyle = M.rubber.light; g.globalAlpha = 0.8; g.stroke()
    g.restore()
  }
  circleStroke(g, R * 0.9, M.rubber.mid, 1.5)
  circleStroke(g, R - 1, M.rubber.light, 1.2, 0.6)
  // jante
  ring(g, rimIn, tireIn, M.alloy.base)
  circleStroke(g, tireIn - 1.5, M.alloy.light, 1.5, 0.9)
  circleStroke(g, rimIn + 1, M.alloy.dark, 1.5)
  // rayons d'alliage
  boundaries(o.items.length, (a) => spoke(g, a, hubR * 0.8, R * 0.06, rimIn, R * 0.045, M.alloy.base, M.alloy.dark, M.alloy.light))
  // enjoliveur et écrous
  disc(g, hubR, M.alloy.base); circleStroke(g, hubR, M.alloy.dark, 1.6); circleStroke(g, hubR * 0.8, M.alloy.light, 1, 0.8)
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU - Math.PI / 2
    g.beginPath(); g.arc(Math.cos(a) * hubR * 0.55, Math.sin(a) * hubR * 0.55, Math.max(2.4, R * 0.014), 0, TAU)
    g.fillStyle = M.alloy.dark; g.fill()
  }
  disc(g, hubR * 0.18, M.alloy.dark)
  return { R, faceR: rimIn, hubR }
}

/** Roue complète (toutes les époques) : aplats nets, sans matière. */
function plainWheel(g: G, o: RenderOptions, R: number): Geo {
  const hubR = o.size * 0.055
  const n = o.items.length
  const step = TAU / Math.max(n, 1)
  o.items.forEach((it, i) => {
    sector(g, i * step, (i + 1) * step, 0, R)
    g.fillStyle = it.color; g.fill()
    g.lineWidth = n > 40 ? 0.75 : 1.5; g.strokeStyle = SURFACE; g.stroke()
  })
  circleStroke(g, R, TEXT, 3, 1)
  disc(g, hubR, SURFACE); circleStroke(g, hubR, TEXT, 2)
  return { R, faceR: R, hubR }
}

const DRAW: Record<WheelEra, (g: G, o: RenderOptions, R: number) => Geo> = {
  all: plainWheel, antiquite: stoneWheel, 'moyen-age': plankWheel, moderne: cartWheel, xixe: ironWheel, xxe: modernWheel,
}

/** Dessine la roue à plat (part 0 à partir de l'angle 0) dans un canevas prêt à être tourné. */
export function renderWheelBitmap(o: RenderOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const px = Math.max(1, Math.round(o.size * o.dpr))
  canvas.width = canvas.height = px
  const g = canvas.getContext('2d')!
  g.scale(px / o.size, px / o.size)
  g.translate(o.size / 2, o.size / 2)
  const R = o.size / 2 - 6
  const geo = DRAW[o.era](g, o, R)
  if (o.showLabels) labels(g, o.items, geo.faceR - 26, geo.faceR - 12, geo.hubR, o.size)
  return canvas
}

/** Parts neutres pour les mini-roues de la frise. */
export function demoItems(n: number): WheelItem[] {
  const palette = ['#8E3B46', '#C76B3A', '#5C8A3C', '#5B4B8A', '#2F7F95', '#B0446E', '#34447A', '#6E7F80']
  return Array.from({ length: n }, (_, i) => ({ id: String(i), label: '', color: palette[i % palette.length] }))
}
