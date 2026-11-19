import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const calls: { table: string; op: string; payload?: unknown }[] = []
let failNext = 0

vi.mock('./supabase', () => {
  const result = () => {
    if (failNext > 0) { failNext--; return { error: { message: 'réseau coupé' } } }
    return { error: null }
  }
  const chain = (table: string, op: string, payload?: unknown) => {
    calls.push({ table, op, payload })
    const r = result()
    const p: any = Promise.resolve(r) // eslint-disable-line @typescript-eslint/no-explicit-any
    p.eq = () => p
    return p
  }
  return {
    supabase: {
      from: (table: string) => ({
        upsert: (payload: unknown) => chain(table, 'upsert', payload),
        update: (payload: unknown) => chain(table, 'update', payload),
        insert: (payload: unknown) => chain(table, 'insert', payload),
        delete: () => chain(table, 'delete'),
      }),
    },
  }
})

import { SyncQueue } from './sync'
import { noteFromRow, noteToRow, philosophyFromRow, philosophyToRow, philosophyPatchToRow, topicFromRow, topicToRow } from './db'
import { emptyNote } from './types'
import { allTopics, philosophies } from './seed'

describe('correspondance base ↔ application', () => {
  it('aller-retour sans perte pour les 87 philosophies et tous les sujets', () => {
    for (const p of philosophies) expect(philosophyFromRow(philosophyToRow(p))).toEqual(p)
    for (const t of allTopics) {
      const back = topicFromRow(topicToRow(t))
      expect(back.id).toBe(t.id)
      expect(back.scope).toBe(t.scope)
      expect(back.philosophy).toBe(t.philosophy)
    }
  })
  it('traduit un patch partiel en colonnes', () => {
    expect(philosophyPatchToRow({ aVerifier: false, favorite: true })).toEqual({ a_verifier: false, favorite: true })
  })
  it('les notes gardent sources et état', () => {
    const n = { ...emptyNote('stoicisme', 'le-temps'), research: '# Titre', status: 'deep' as const, sources: [{ title: 'Manuel', url: 'https://x.org', type: 'livre' as const }] }
    const row = noteToRow(n)
    expect(row.philosophy_id).toBe('stoicisme')
    expect(noteFromRow({ ...row, updated_at: 'x' }).sources).toEqual(n.sources)
  })
  it('chaque sujet propre est rattaché à une philosophie existante', () => {
    const ids = new Set(philosophies.map((p) => p.id))
    expect(allTopics.filter((t) => t.scope === 'own').every((t) => ids.has(t.philosophy!))).toBe(true)
  })
})

describe('file de synchronisation', () => {
  beforeEach(() => { vi.useFakeTimers(); calls.length = 0; failNext = 0 })
  afterEach(() => { vi.useRealTimers() })

  it('regroupe les frappes successives d’une même note en un seul envoi (debounce)', async () => {
    const q = new SyncQueue('u1')
    const note = emptyNote('stoicisme', 'le-temps')
    q.add({ kind: 'note', key: 'note:a', payload: { ...note, research: 'a' } }, 800)
    q.add({ kind: 'note', key: 'note:a', payload: { ...note, research: 'ab' } }, 800)
    q.add({ kind: 'note', key: 'note:a', payload: { ...note, research: 'abc' } }, 800)
    expect(q.status).toBe('pending')
    await vi.advanceTimersByTimeAsync(900)
    expect(calls).toHaveLength(1)
    expect((calls[0].payload as { research: string }).research).toBe('abc')
    expect(q.status).toBe('saved')
    expect(q.size).toBe(0)
  })

  it('garde l’écriture en cas d’erreur réseau puis réessaie', async () => {
    const q = new SyncQueue('u2')
    failNext = 1
    q.add({ kind: 'note', key: 'note:b', payload: { ...emptyNote('stoicisme', 'le-temps'), research: 'important' } })
    await vi.advanceTimersByTimeAsync(10)
    expect(q.status).toBe('error')
    expect(q.size).toBe(1) // le texte n'est pas perdu
    await vi.advanceTimersByTimeAsync(3500)
    expect(q.status).toBe('saved')
    expect(q.size).toBe(0)
    expect(calls).toHaveLength(2)
  })

  it('fusionne les modifications d’une même philosophie', async () => {
    const q = new SyncQueue('u3')
    q.add({ kind: 'philosophy', key: 'ph:x', payload: { id: 'x', patch: { favorite: true } } }, 300)
    q.add({ kind: 'philosophy', key: 'ph:x', payload: { id: 'x', patch: { reserve: true } } }, 300)
    await vi.advanceTimersByTimeAsync(400)
    expect(calls).toHaveLength(1)
    expect(calls[0].payload).toEqual({ favorite: true, reserve: true })
  })

  it('la réinitialisation de l’historique annule les tirages en attente', async () => {
    const q = new SyncQueue('u4')
    q.add({ kind: 'draw', key: 'd1', payload: { type: 'philosophy', philosophy: 'x', at: 't' } }, 500)
    q.add({ kind: 'resetDraws', key: 'resetDraws', payload: null })
    await vi.advanceTimersByTimeAsync(600)
    expect(calls.map((c) => c.op)).toEqual(['delete'])
  })
})
