import type {
  DrawSettings, Draw, EraId, Filters, NoteStatus, Philosophy, Topic,
} from './types'
import { cellKey } from './types'

export const ERAS: { id: EraId; label: string; from: number; to: number }[] = [
  { id: 'antiquite', label: 'Antiquité (avant 500)', from: -Infinity, to: 500 },
  { id: 'moyen-age', label: 'Moyen Âge (500–1500)', from: 500, to: 1500 },
  { id: 'moderne', label: 'Moderne (1500–1800)', from: 1500, to: 1800 },
  { id: 'xixe', label: 'XIXe siècle', from: 1800, to: 1900 },
  { id: 'xxe', label: 'XXe siècle', from: 1900, to: 2000 },
  { id: 'xxie', label: 'XXIe siècle', from: 2000, to: Infinity },
]

/** Époque d'une philosophie, d'après son année de début. */
export function eraOf(startYear: number): EraId {
  return ERAS.find((e) => startYear >= e.from && startYear < e.to)!.id
}

export const emptyFilters: Filters = {
  families: [], eras: [], yearRange: null, regions: [], favoritesOnly: false, toVerifyOnly: false,
}

export function matchesFilters(p: Philosophy, f: Filters): boolean {
  if (f.families.length && !f.families.includes(p.family)) return false
  if (f.eras.length && !f.eras.includes(eraOf(p.startYear))) return false
  if (f.yearRange && (p.startYear < f.yearRange[0] || p.startYear > f.yearRange[1])) return false
  if (f.regions.length && !f.regions.includes(p.region)) return false
  if (f.favoritesOnly && !p.favorite) return false
  if (f.toVerifyOnly && !p.aVerifier) return false
  return true
}

/** Sujets de la roue pour une philosophie : communs actifs + propres à elle, seulement. */
export function topicsFor(philosophyId: string, topics: Topic[]): Topic[] {
  return topics
    .filter((t) => t.active && (t.scope === 'common' || t.philosophy === philosophyId))
    .sort((a, b) => (a.scope === b.scope ? a.order - b.order : a.scope === 'common' ? -1 : 1))
}

export interface DrawContext {
  philosophies: Philosophy[]
  topics: Topic[]
  filters: Filters
  settings: DrawSettings
  history: Draw[]
  statuses: Record<string, NoteStatus>
}

const drawnCells = (history: Draw[]) =>
  new Set(history.filter((d) => d.type === 'topic' && d.topic).map((d) => cellKey(d.philosophy, d.topic!)))

/** Une case est tirable selon les réglages (tirée = historique ; approfondie = statut). */
export function isCellAvailable(
  philosophyId: string,
  topicId: string,
  ctx: Pick<DrawContext, 'settings' | 'history' | 'statuses'>,
  drawn: Set<string> = drawnCells(ctx.history),
): boolean {
  const key = cellKey(philosophyId, topicId)
  if (ctx.settings.noRepeat && drawn.has(key)) return false
  if (ctx.settings.onlyRemaining && ctx.statuses[key] === 'deep') return false
  return true
}

export function availableTopics(philosophyId: string, ctx: DrawContext): Topic[] {
  const drawn = drawnCells(ctx.history)
  return topicsFor(philosophyId, ctx.topics).filter((t) => isCellAvailable(philosophyId, t.id, ctx, drawn))
}

/** Philosophies sur la roue : filtres, hors « en réserve », avec au moins une case disponible. */
export function wheelPhilosophies(ctx: DrawContext): Philosophy[] {
  const drawn = drawnCells(ctx.history)
  return ctx.philosophies
    .filter((p) => !p.reserve && matchesFilters(p, ctx.filters))
    .filter((p) => {
      if (!ctx.settings.noRepeat && !ctx.settings.onlyRemaining) return true
      return topicsFor(p.id, ctx.topics).some((t) => isCellAvailable(p.id, t.id, ctx, drawn))
    })
}

/** Poids du mode découverte : moins il y a de notes approfondies dans la famille et l'époque, plus c'est probable. */
export function discoveryWeights(wheel: Philosophy[], ctx: DrawContext): number[] {
  const deepByFamily: Record<string, number> = {}
  const deepByEra: Record<string, number> = {}
  const byId = new Map(ctx.philosophies.map((p) => [p.id, p]))
  for (const [key, status] of Object.entries(ctx.statuses)) {
    if (status !== 'deep') continue
    const p = byId.get(key.split('|')[0])
    if (!p) continue
    deepByFamily[p.family] = (deepByFamily[p.family] ?? 0) + 1
    const era = eraOf(p.startYear)
    deepByEra[era] = (deepByEra[era] ?? 0) + 1
  }
  return wheel.map((p) => 1 / (1 + (deepByFamily[p.family] ?? 0) + (deepByEra[eraOf(p.startYear)] ?? 0)))
}

export function pickWeighted(weights: number[], rng: () => number = Math.random): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r < 0) return i
  }
  return weights.length - 1
}

export type PhilosophyDraw =
  | { ok: true; wheel: Philosophy[]; index: number }
  | { ok: false; reason: 'no-match' | 'exhausted' }

/** Tire une philosophie. `exhausted` : les réglages ont épuisé toutes les cases restantes. */
export function drawPhilosophy(ctx: DrawContext, rng: () => number = Math.random): PhilosophyDraw {
  const wheel = wheelPhilosophies(ctx)
  if (wheel.length === 0) {
    const anyMatch = ctx.philosophies.some((p) => !p.reserve && matchesFilters(p, ctx.filters))
    return { ok: false, reason: anyMatch ? 'exhausted' : 'no-match' }
  }
  const weights = ctx.settings.discovery ? discoveryWeights(wheel, ctx) : wheel.map(() => 1)
  return { ok: true, wheel, index: pickWeighted(weights, rng) }
}

export type TopicDraw =
  | { ok: true; wheel: Topic[]; index: number }
  | { ok: false; reason: 'exhausted' }

export function drawTopic(philosophyId: string, ctx: DrawContext, rng: () => number = Math.random): TopicDraw {
  const wheel = availableTopics(philosophyId, ctx)
  if (wheel.length === 0) return { ok: false, reason: 'exhausted' }
  return { ok: true, wheel, index: Math.floor(rng() * wheel.length) }
}

/** Progression d'une philosophie : sujets approfondis sur total des sujets applicables. */
export function progressOf(philosophyId: string, topics: Topic[], statuses: Record<string, NoteStatus>) {
  const list = topicsFor(philosophyId, topics)
  const deep = list.filter((t) => statuses[cellKey(philosophyId, t.id)] === 'deep').length
  return { deep, total: list.length }
}
