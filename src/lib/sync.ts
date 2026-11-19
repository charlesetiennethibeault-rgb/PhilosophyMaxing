import { supabase } from './supabase'
import { noteToRow, philosophyPatchToRow, prefsToRow } from './db'
import type { DrawSettings, Filters, Note, Philosophy } from './types'

/**
 * File d'écritures vers Supabase. Les modifications sont déjà visibles à l'écran (interface optimiste) ;
 * la file les envoie après un court délai (debounce), les garde dans le stockage local tant qu'elles ne
 * sont pas confirmées, et réessaie en cas d'erreur réseau.
 */
export type Job =
  | { kind: 'note'; key: string; payload: Note }
  | { kind: 'philosophy'; key: string; payload: { id: string; patch: Partial<Philosophy> } }
  | { kind: 'topic'; key: string; payload: { id: string; active: boolean } }
  | { kind: 'settings'; key: string; payload: { settings: DrawSettings; filters: Filters } }
  | { kind: 'draw'; key: string; payload: { type: 'philosophy' | 'topic'; philosophy: string; topic?: string; at: string } }
  | { kind: 'resetDraws'; key: string; payload: null }

type Stored = Job & { v: number; runAt: number }
export type SyncStatus = 'saved' | 'pending' | 'error'

const RETRY_MS = [3000, 8000, 20000]

export class SyncQueue {
  private jobs: Stored[]
  private timer: ReturnType<typeof setTimeout> | undefined
  private running = false
  private failures = 0
  private version = 0
  private listeners = new Set<(s: SyncStatus) => void>()
  status: SyncStatus = 'saved'

  constructor(private userId: string, private storageKey = `pm.queue.${userId}`) {
    this.jobs = this.restore()
    if (this.jobs.length) { this.status = 'pending'; this.schedule() }
  }

  onStatus(fn: (s: SyncStatus) => void) {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }
  get size() { return this.jobs.length }

  /** Ajoute ou remplace (même clé) une écriture. `delay` = debounce. */
  add(job: Job, delay = 0) {
    const existing = this.jobs.find((j) => j.key === job.key)
    let merged: Job = job
    if (existing && job.kind === 'philosophy' && existing.kind === 'philosophy') {
      merged = { ...job, payload: { id: job.payload.id, patch: { ...existing.payload.patch, ...job.payload.patch } } }
    }
    const stored: Stored = { ...merged, v: ++this.version, runAt: Date.now() + delay }
    if (job.kind === 'resetDraws') {
      // les tirages en attente n'ont plus de raison d'être envoyés
      this.jobs = [...this.jobs.filter((j) => j.kind !== 'draw' && j.key !== job.key), stored]
    } else {
      this.jobs = existing ? this.jobs.map((j) => (j.key === job.key ? stored : j)) : [...this.jobs, stored]
    }
    this.persist()
    this.set('pending')
    this.schedule()
  }

  /** Attend que la file soit vide (ou le délai écoulé), en envoyant tout de suite. */
  async drain(timeoutMs: number) {
    if (!this.jobs.length) return
    this.flushNow()
    await new Promise<void>((resolve) => {
      const done = () => { off(); clearTimeout(t); resolve() }
      const off = this.onStatus((s) => { if (s === 'saved') done() })
      const t = setTimeout(done, timeoutMs)
    })
  }

  /** Envoie tout de suite ce qui est en attente (retour sur l'onglet, fermeture). */
  flushNow() {
    this.jobs.forEach((j) => { j.runAt = 0 })
    this.schedule()
  }

  private set(s: SyncStatus) {
    if (this.status === s) return
    this.status = s
    this.listeners.forEach((l) => l(s))
  }

  private schedule() {
    clearTimeout(this.timer)
    if (!this.jobs.length || this.running) return
    const next = Math.min(...this.jobs.map((j) => j.runAt))
    this.timer = setTimeout(() => void this.run(), Math.max(0, next - Date.now()))
  }

  private async run() {
    if (this.running) return
    this.running = true
    try {
      for (;;) {
        const job = this.jobs.filter((j) => j.runAt <= Date.now()).sort((a, b) => a.v - b.v)[0]
        if (!job) break
        await this.exec(job)
        // ne retire que si personne n'a modifié la même clé pendant l'envoi
        const current = this.jobs.find((j) => j.key === job.key)
        if (current && current.v === job.v) this.jobs = this.jobs.filter((j) => j.key !== job.key)
        this.failures = 0
        this.persist()
      }
      this.set(this.jobs.length ? 'pending' : 'saved')
    } catch (e) {
      console.warn('Synchronisation impossible, nouvelle tentative :', e)
      const wait = RETRY_MS[Math.min(this.failures++, RETRY_MS.length - 1)]
      this.jobs.forEach((j) => { if (j.runAt <= Date.now()) j.runAt = Date.now() + wait })
      this.set('error')
    } finally {
      this.running = false
      this.schedule()
    }
  }

  private async exec(job: Stored) {
    const uid = this.userId
    const fail = (r: { error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message) }
    switch (job.kind) {
      case 'note':
        fail(await supabase.from('notes').upsert({ ...noteToRow(job.payload), user_id: uid }, { onConflict: 'user_id,philosophy_id,topic_id' }))
        break
      case 'philosophy':
        fail(await supabase.from('philosophies').update(philosophyPatchToRow(job.payload.patch)).eq('user_id', uid).eq('id', job.payload.id))
        break
      case 'topic':
        fail(await supabase.from('topics').update({ active: job.payload.active }).eq('user_id', uid).eq('id', job.payload.id))
        break
      case 'settings':
        fail(await supabase.from('settings').upsert({ user_id: uid, ...prefsToRow(job.payload.settings, job.payload.filters) }, { onConflict: 'user_id' }))
        break
      case 'draw':
        fail(await supabase.from('draws').insert({
          user_id: uid, type: job.payload.type, philosophy_id: job.payload.philosophy,
          topic_id: job.payload.topic ?? null, drawn_at: job.payload.at,
        }))
        break
      case 'resetDraws':
        fail(await supabase.from('draws').delete().eq('user_id', uid))
        break
    }
  }

  private persist() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.jobs)) } catch { /* stockage indisponible */ }
  }
  private restore(): Stored[] {
    try {
      const jobs = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as Stored[]
      this.version = jobs.reduce((m, j) => Math.max(m, j.v), 0)
      return jobs.map((j) => ({ ...j, runAt: 0 }))
    } catch { return [] }
  }
}
