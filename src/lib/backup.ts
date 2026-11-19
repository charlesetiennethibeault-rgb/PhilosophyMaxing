import type { Draw, DrawSettings, Family, Filters, Note, Philosophy, Synthesis, Theme, Topic } from './types'

export const BACKUP_VERSION = 1

export interface Backup {
  app: 'PhilosophyMaxing'
  version: number
  exportedAt: string
  families: Family[]
  themes: Theme[]
  philosophies: Philosophy[]
  topics: Topic[]
  notes: Note[]
  syntheses: Synthesis[]
  draws: Draw[]
  settings: DrawSettings
  filters: Filters
}

export function buildBackup(data: Omit<Backup, 'app' | 'version' | 'exportedAt'>): Backup {
  return { app: 'PhilosophyMaxing', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), ...data }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const arr = (v: unknown) => (Array.isArray(v) ? v : null)

/** Valide un fichier de sauvegarde avant import. Renvoie la sauvegarde ou un message d'erreur en français. */
export function parseBackup(text: string): { ok: true; backup: Backup } | { ok: false; error: string } {
  let raw: unknown
  try { raw = JSON.parse(text) } catch { return { ok: false, error: 'Ce fichier n’est pas du JSON valide.' } }
  if (!isObj(raw) || raw.app !== 'PhilosophyMaxing') return { ok: false, error: 'Ce fichier n’est pas une sauvegarde PhilosophyMaxing.' }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'Cette sauvegarde vient d’une version plus récente de l’application.' }
  }
  const lists = ['families', 'themes', 'philosophies', 'topics', 'notes', 'syntheses', 'draws'] as const
  for (const k of lists) if (!arr(raw[k])) return { ok: false, error: `Sauvegarde incomplète : « ${k} » est absent.` }

  const fam = new Set((raw.families as Family[]).map((f) => f.id))
  const ph = new Set((raw.philosophies as Philosophy[]).map((p) => p.id))
  const th = new Set((raw.themes as Theme[]).map((t) => t.id))
  const tp = new Set((raw.topics as Topic[]).map((t) => t.id))
  if ((raw.philosophies as Philosophy[]).some((p) => !p.id || !p.name || !fam.has(p.family))) {
    return { ok: false, error: 'Sauvegarde incohérente : une philosophie n’a pas de famille valide.' }
  }
  if ((raw.topics as Topic[]).some((t) => !t.id || (t.scope === 'own' ? !ph.has(t.philosophy ?? '') : t.theme && !th.has(t.theme)))) {
    return { ok: false, error: 'Sauvegarde incohérente : un sujet pointe vers une philosophie ou un thème absent.' }
  }
  if ((raw.notes as Note[]).some((n) => !ph.has(n.philosophy) || !tp.has(n.topic))) {
    return { ok: false, error: 'Sauvegarde incohérente : une note pointe vers une case absente.' }
  }
  return { ok: true, backup: raw as unknown as Backup }
}

export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
