import { supabase } from './supabase'
import { emptyFilters } from './draw'
import { families, themes, philosophies as seedPhilosophies, allTopics as seedTopics } from './seed'
import type { Draw, DrawSettings, Family, Filters, Note, Philosophy, Synthesis, Theme, Topic } from './types'

/* ---------- correspondance base (snake_case) <-> application (camelCase) ---------- */

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export const philosophyFromRow = (r: Row): Philosophy => ({
  id: r.id, name: r.name, family: r.family_id, region: r.region,
  startYear: r.start_year, endYear: r.end_year, dateLabel: r.date_label,
  founder: r.founder, actors: r.actors ?? [], description: r.description,
  aVerifier: r.a_verifier, reserve: r.reserve, favorite: r.favorite,
  tags: r.tags ?? [], order: r.sort_order,
  synthesis: r.synthesis ?? '', opinion: r.opinion ?? '', context: r.context ?? '',
})

/**
 * Ligne complète d'une philosophie. Les trois textes personnels n'y sont pas, sauf `withWritings` :
 * un upsert qui ne les mentionne pas laisse intacts ceux déjà écrits (et marche même avant la migration 0002).
 */
export const philosophyToRow = (p: Philosophy, withWritings = false): Row => ({
  id: p.id, name: p.name, family_id: p.family, region: p.region,
  start_year: p.startYear, end_year: p.endYear, date_label: p.dateLabel,
  founder: p.founder, actors: p.actors, description: p.description,
  a_verifier: p.aVerifier, reserve: p.reserve, favorite: p.favorite,
  tags: p.tags, sort_order: p.order,
  ...(withWritings ? { synthesis: p.synthesis, opinion: p.opinion, context: p.context } : {}),
})

/** Traduit un patch partiel d'application vers les colonnes de la base. */
export function philosophyPatchToRow(patch: Partial<Philosophy>): Row {
  const map: Record<string, string> = {
    name: 'name', family: 'family_id', region: 'region', startYear: 'start_year', endYear: 'end_year',
    dateLabel: 'date_label', founder: 'founder', actors: 'actors', description: 'description',
    aVerifier: 'a_verifier', reserve: 'reserve', favorite: 'favorite', tags: 'tags', order: 'sort_order',
    synthesis: 'synthesis', opinion: 'opinion', context: 'context',
  }
  return Object.fromEntries(Object.entries(patch).map(([k, v]) => [map[k], v]))
}

export const topicFromRow = (r: Row): Topic => ({
  id: r.id, name: r.name, short: r.short, scope: r.scope,
  theme: r.theme_id ?? undefined, philosophy: r.philosophy_id ?? undefined,
  active: r.active, question: r.question, order: r.sort_order, aVerifier: r.a_verifier,
})

export const topicToRow = (t: Topic): Row => ({
  id: t.id, name: t.name, short: t.short, scope: t.scope,
  theme_id: t.theme ?? null, philosophy_id: t.philosophy ?? null,
  active: t.active, question: t.question, a_verifier: t.aVerifier ?? false, sort_order: t.order,
})

export const noteFromRow = (r: Row): Note => ({
  philosophy: r.philosophy_id, topic: r.topic_id, research: r.research, sources: r.sources ?? [],
  reaction: r.reaction, status: r.status, favorite: r.favorite, tags: r.tags ?? [], updatedAt: r.updated_at,
})

export const noteToRow = (n: Note): Row => ({
  philosophy_id: n.philosophy, topic_id: n.topic, research: n.research, sources: n.sources,
  reaction: n.reaction, status: n.status, favorite: n.favorite, tags: n.tags,
})

export const familyFromRow = (r: Row): Family => ({ id: r.id, name: r.name, color: r.color, order: r.sort_order })
export const familyToRow = (f: Family): Row => ({ id: f.id, name: f.name, color: f.color, sort_order: f.order })
export const themeFromRow = (r: Row): Theme => ({ id: r.id, name: r.name, order: r.sort_order })
export const themeToRow = (t: Theme): Row => ({ id: t.id, name: t.name, sort_order: t.order })

export const synthesisFromRow = (r: Row): Synthesis => ({
  philosophy: r.philosophy_id, theme: r.theme_id, body: r.body, status: r.status, updatedAt: r.updated_at,
})
export const synthesisToRow = (s: Synthesis): Row => ({
  philosophy_id: s.philosophy, theme_id: s.theme, body: s.body, status: s.status,
})

export const drawFromRow = (r: Row): Draw => ({
  id: r.id, type: r.type, philosophy: r.philosophy_id, topic: r.topic_id ?? undefined, at: r.drawn_at,
})

export interface Prefs { settings: DrawSettings; filters: Filters; seeded: boolean }

const defaultSettings: DrawSettings = { noRepeat: true, onlyRemaining: false, discovery: false, sound: true }

export const prefsFromRow = (r: Row | null): Prefs => ({
  seeded: !!r?.seeded,
  settings: r
    ? { noRepeat: r.no_repeat, onlyRemaining: r.only_remaining, discovery: r.discovery, sound: r.sound }
    : defaultSettings,
  filters: { ...emptyFilters, ...(r?.last_filters ?? {}) },
})

export const prefsToRow = (settings: DrawSettings, filters: Filters): Row => ({
  no_repeat: settings.noRepeat, only_remaining: settings.onlyRemaining,
  discovery: settings.discovery, sound: settings.sound, last_filters: filters,
})

/* ---------- lecture ---------- */

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as T
}

export async function loadPrefs(): Promise<Prefs> {
  const res = await supabase.from('settings').select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return prefsFromRow(res.data)
}

/** `schemaReady` : faux tant que la migration 0002 (colonnes des textes personnels) n'est pas appliquée. */
export async function loadPhilosophies(): Promise<{ list: Philosophy[]; schemaReady: boolean }> {
  const rows = check<Row[]>(await supabase.from('philosophies').select('*').order('sort_order').range(0, 999))
  return { list: rows.map(philosophyFromRow), schemaReady: rows.length === 0 || 'synthesis' in rows[0] }
}
export async function loadTopics(): Promise<Topic[]> {
  const rows = check<Row[]>(await supabase.from('topics').select('*').order('sort_order').range(0, 4999))
  return rows.map(topicFromRow)
}
export async function loadNotes(): Promise<Note[]> {
  const rows = check<Row[]>(await supabase.from('notes').select('*').range(0, 9999))
  return rows.map(noteFromRow)
}
export async function loadFamilies(): Promise<Family[]> {
  const rows = check<Row[]>(await supabase.from('families').select('*').order('sort_order').range(0, 999))
  return rows.map(familyFromRow)
}
export async function loadThemes(): Promise<Theme[]> {
  const rows = check<Row[]>(await supabase.from('themes').select('*').order('sort_order').range(0, 999))
  return rows.map(themeFromRow)
}
export async function loadSyntheses(): Promise<Synthesis[]> {
  const rows = check<Row[]>(await supabase.from('theme_syntheses').select('*').range(0, 9999))
  return rows.map(synthesisFromRow)
}
export async function loadDraws(): Promise<Draw[]> {
  const rows = check<Row[]>(await supabase.from('draws').select('*').order('drawn_at').range(0, 9999))
  return rows.map(drawFromRow)
}

/* ---------- chargement initial idempotent ---------- */

/**
 * Insère familles, thèmes, sujets et philosophies de seed/ la première fois seulement.
 * `ignoreDuplicates` = « on conflict do nothing » : relancer ne crée aucun doublon et n'écrase rien.
 * Le drapeau `settings.seeded` évite de ressusciter ce que tu aurais supprimé plus tard.
 */
export async function seedIfNeeded(userId: string, prefs: Prefs): Promise<void> {
  if (prefs.seeded) return
  const opts = { onConflict: 'user_id,id', ignoreDuplicates: true }
  const withUser = <T extends Row>(rows: T[]) => rows.map((r) => ({ ...r, user_id: userId }))

  const steps: [string, Row[]][] = [
    ['families', families.map((f) => ({ id: f.id, name: f.name, color: f.color, sort_order: f.order }))],
    ['themes', themes.map((t) => ({ id: t.id, name: t.name, sort_order: t.order }))],
    ['philosophies', seedPhilosophies.map((p) => philosophyToRow(p))],
    ['topics', seedTopics.map(topicToRow)],
  ]
  for (const [table, rows] of steps) {
    for (let i = 0; i < rows.length; i += 100) {
      const res = await supabase.from(table).upsert(withUser(rows.slice(i, i + 100)), opts)
      if (res.error) throw new Error(`${table} : ${res.error.message}`)
    }
  }
  const res = await supabase.from('settings').upsert(
    { user_id: userId, ...prefsToRow(prefs.settings, prefs.filters), seeded: true },
    { onConflict: 'user_id' },
  )
  if (res.error) throw new Error(`settings : ${res.error.message}`)
}

/* ---------- import d'une sauvegarde JSON ---------- */

/** Réécrit les lignes de la sauvegarde (mêmes identifiants = mises à jour, rien n'est supprimé). */
export async function importBackup(userId: string, b: import('./backup').Backup): Promise<void> {
  const withUser = (rows: Row[]) => rows.map((r) => ({ ...r, user_id: userId }))
  const steps: [string, Row[], string][] = [
    ['families', b.families.map(familyToRow), 'user_id,id'],
    ['themes', b.themes.map(themeToRow), 'user_id,id'],
    ['philosophies', b.philosophies.map((p) => philosophyToRow(p, true)), 'user_id,id'],
    ['topics', b.topics.map(topicToRow), 'user_id,id'],
    ['notes', b.notes.map(noteToRow), 'user_id,philosophy_id,topic_id'],
    ['theme_syntheses', b.syntheses.map(synthesisToRow), 'user_id,philosophy_id,theme_id'],
    ['draws', b.draws.filter((d) => d.id).map((d) => ({ id: d.id, type: d.type, philosophy_id: d.philosophy, topic_id: d.topic ?? null, drawn_at: d.at })), 'id'],
  ]
  for (const [table, rows, onConflict] of steps) {
    for (let i = 0; i < rows.length; i += 100) {
      const res = await supabase.from(table).upsert(withUser(rows.slice(i, i + 100)), { onConflict })
      if (res.error) throw new Error(`${table} : ${res.error.message}`)
    }
  }
  const res = await supabase.from('settings').upsert(
    { user_id: userId, ...prefsToRow(b.settings, b.filters), seeded: true }, { onConflict: 'user_id' })
  if (res.error) throw new Error(`settings : ${res.error.message}`)
}
