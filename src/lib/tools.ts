import { ERAS, eraOf, topicsFor } from './draw'
import { cellKey, type Draw, type Family, type Note, type NoteStatus, type Philosophy, type Synthesis, type Theme, type Topic } from './types'

/** Minuscules sans accents, pour chercher « epicure » et trouver « Épicure ». */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function slugify(name: string, taken: Iterable<string> = []): string {
  const base = normalize(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'element'
  const used = new Set(taken)
  let id = base
  for (let i = 2; used.has(id); i++) id = `${base}-${i}`
  return id
}

/* ---------- recherche ---------- */

export interface SearchHit { philosophy: Philosophy; notes: Note[]; matchedIn: ('nom' | 'acteur' | 'fiche' | 'notes')[] }

const noteText = (n: Note) =>
  normalize([n.research, n.reaction, n.tags.join(' '), n.sources.map((s) => `${s.title} ${s.url}`).join(' ')].join(' '))

/** Cherche dans le nom, les acteurs, le fondateur, la description et le texte de mes notes. */
export function searchPhilosophies(query: string, list: Philosophy[], notes: Note[]): SearchHit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return list.map((philosophy) => ({ philosophy, notes: [], matchedIn: [] }))
  const byPhil = new Map<string, Note[]>()
  for (const n of notes) byPhil.set(n.philosophy, [...(byPhil.get(n.philosophy) ?? []), n])

  const hits: SearchHit[] = []
  for (const p of list) {
    const name = normalize(p.name)
    const actors = normalize(p.actors.join(' '))
    const sheet = normalize(`${p.founder} ${p.description} ${p.region} ${p.dateLabel} ${p.tags.join(' ')}`)
    const mine = byPhil.get(p.id) ?? []
    // chaque mot doit être trouvé quelque part dans la philosophie ou dans l'une de ses notes
    const matchedNotes = mine.filter((n) => terms.some((t) => noteText(n).includes(t)))
    const ok = terms.every((t) => name.includes(t) || actors.includes(t) || sheet.includes(t) || mine.some((n) => noteText(n).includes(t)))
    if (!ok) continue
    const matchedIn: SearchHit['matchedIn'] = []
    if (terms.some((t) => name.includes(t))) matchedIn.push('nom')
    if (terms.some((t) => actors.includes(t))) matchedIn.push('acteur')
    if (terms.some((t) => sheet.includes(t))) matchedIn.push('fiche')
    if (matchedNotes.length) matchedIn.push('notes')
    hits.push({ philosophy: p, notes: matchedNotes, matchedIn })
  }
  return hits
}

/* ---------- progression ---------- */

export interface Progress { deep: number; draft: number; total: number; pct: number }
const pct = (deep: number, total: number) => (total ? Math.round((100 * deep) / total) : 0)

function tally(ps: Philosophy[], topics: Topic[], statuses: Record<string, NoteStatus>): Progress {
  let deep = 0, draft = 0, total = 0
  for (const p of ps) {
    for (const t of topicsFor(p.id, topics)) {
      total++
      const s = statuses[cellKey(p.id, t.id)]
      if (s === 'deep') deep++
      else if (s === 'draft') draft++
    }
  }
  return { deep, draft, total, pct: pct(deep, total) }
}

export function progressSummary(philosophies: Philosophy[], topics: Topic[], statuses: Record<string, NoteStatus>, families: Family[]) {
  return {
    global: tally(philosophies, topics, statuses),
    byFamily: families.map((f) => ({ family: f, ...tally(philosophies.filter((p) => p.family === f.id), topics, statuses) })),
    byEra: ERAS.map((e) => ({ era: e, ...tally(philosophies.filter((p) => eraOf(p.startYear) === e.id), topics, statuses) })),
  }
}

/* ---------- synthèses par thème ---------- */

/** Sujets communs (actifs) d'un thème. */
export const themeTopics = (themeId: string, topics: Topic[]) =>
  topics.filter((t) => t.scope === 'common' && t.active && t.theme === themeId).sort((a, b) => a.order - b.order)

/** Vrai quand tous les sujets du thème sont au moins en brouillon pour cette philosophie. */
export function themeReady(philosophyId: string, themeId: string, topics: Topic[], statuses: Record<string, NoteStatus>): boolean {
  const list = themeTopics(themeId, topics)
  return list.length > 0 && list.every((t) => {
    const s = statuses[cellKey(philosophyId, t.id)]
    return s === 'draft' || s === 'deep'
  })
}

/** Suggère d'écrire la synthèse seulement si le thème est prêt et qu'elle est encore vide. */
export function shouldSuggestSynthesis(philosophyId: string, theme: Theme, topics: Topic[], statuses: Record<string, NoteStatus>, syntheses: Record<string, Synthesis>) {
  const s = syntheses[`${philosophyId}|${theme.id}`]
  return themeReady(philosophyId, theme.id, topics, statuses) && !(s && s.body.trim())
}

export const synthesisQuestion = (philosophyName: string, themeName: string) =>
  `Que dit ${philosophyName.replace(/ \(.*\)$/, '')} de « ${themeName.toLowerCase()} », tous sujets confondus ?`

/* ---------- réordonner ---------- */

/** Renvoie la liste réordonnée avec des `order` consécutifs ; seuls les éléments modifiés comptent. */
export function move<T extends { id: string; order: number }>(list: T[], id: string, dir: -1 | 1): T[] {
  const sorted = [...list].sort((a, b) => a.order - b.order)
  const i = sorted.findIndex((x) => x.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= sorted.length) return sorted.map((x, k) => ({ ...x, order: k + 1 }))
  ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
  return sorted.map((x, k) => ({ ...x, order: k + 1 }))
}

/* ---------- historique ---------- */

export const sortedHistory = (history: Draw[]) => [...history].sort((a, b) => b.at.localeCompare(a.at))
