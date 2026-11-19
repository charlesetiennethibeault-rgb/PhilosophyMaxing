import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadDraws, loadNotes, loadPhilosophies, loadPrefs, loadTopics, seedIfNeeded } from './db'
import { SyncQueue, type SyncStatus } from './sync'
import type { Draw, DrawSettings, Filters, Note, NoteStatus, Philosophy, Topic } from './types'
import { cellKey } from './types'

/** État de l'application, synchronisé avec Supabase (interface optimiste + file d'écritures). */
export function useAppState(userId: string) {
  const queue = useMemo(() => new SyncQueue(userId), [userId])
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sync, setSync] = useState<SyncStatus>(queue.status)

  const [philosophies, setPhilosophies] = useState<Philosophy[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [history, setHistory] = useState<Draw[]>([])
  const [settings, setSettingsState] = useState<DrawSettings>({ noRepeat: true, onlyRemaining: false, discovery: false, sound: true })
  const [filters, setFiltersState] = useState<Filters>({ families: [], eras: [], yearRange: null, regions: [], favoritesOnly: false, toVerifyOnly: false })
  const prefsRef = useRef({ settings, filters })
  prefsRef.current = { settings, filters }

  useEffect(() => queue.onStatus(setSync), [queue])

  const fetchData = useCallback(async () => {
    const [ph, tp, nt, dr] = await Promise.all([loadPhilosophies(), loadTopics(), loadNotes(), loadDraws()])
    setPhilosophies(ph); setTopics(tp); setHistory(dr)
    setNotes(Object.fromEntries(nt.map((n) => [cellKey(n.philosophy, n.topic), n])))
  }, [])

  const boot = useCallback(async () => {
    setReady(false); setLoadError(null)
    try {
      await queue.drain(4000) // envoie d'abord ce qui attendait en local
      const prefs = await loadPrefs()
      await seedIfNeeded(userId, prefs)
      await fetchData()
      setSettingsState(prefs.settings); setFiltersState(prefs.filters)
      setReady(true)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    }
  }, [queue, userId, fetchData])

  useEffect(() => { void boot() }, [boot])

  /** Recharge depuis Supabase (retour sur l'onglet), sauf s'il reste des écritures en attente. */
  const refresh = useCallback(async () => {
    if (queue.size > 0) return
    try { await fetchData() } catch { /* on garde l'affichage actuel */ }
  }, [queue, fetchData])

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') queue.flushNow() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', () => queue.flushNow())
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [queue])

  const statuses = useMemo(() => {
    const m: Record<string, NoteStatus> = {}
    for (const [k, n] of Object.entries(notes)) m[k] = n.status
    return m
  }, [notes])

  const patchPhilosophy = useCallback((id: string, patch: Partial<Pick<Philosophy, 'favorite' | 'reserve' | 'aVerifier'>>) => {
    setPhilosophies((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    queue.add({ kind: 'philosophy', key: `ph:${id}`, payload: { id, patch } }, 300)
  }, [queue])

  const saveSettingsLater = useCallback(() => {
    queue.add({ kind: 'settings', key: 'settings', payload: prefsRef.current }, 600)
  }, [queue])

  const setFilters = useCallback((f: Filters) => {
    prefsRef.current = { ...prefsRef.current, filters: f }
    setFiltersState(f); saveSettingsLater()
  }, [saveSettingsLater])

  const setSettings = useCallback((patch: Partial<DrawSettings>) => {
    prefsRef.current = { ...prefsRef.current, settings: { ...prefsRef.current.settings, ...patch } }
    setSettingsState(prefsRef.current.settings); saveSettingsLater()
  }, [saveSettingsLater])

  const addDraw = useCallback((d: Omit<Draw, 'at'>) => {
    const at = new Date().toISOString()
    setHistory((h) => [...h, { ...d, at }])
    queue.add({ kind: 'draw', key: `draw:${at}:${d.philosophy}:${d.topic ?? ''}`, payload: { ...d, at } })
  }, [queue])

  const resetHistory = useCallback(() => {
    setHistory([])
    queue.add({ kind: 'resetDraws', key: 'resetDraws', payload: null })
  }, [queue])

  const setTopicActive = useCallback((id: string, active: boolean) => {
    setTopics((l) => l.map((t) => (t.id === id ? { ...t, active } : t)))
    queue.add({ kind: 'topic', key: `topic:${id}`, payload: { id, active } }, 300)
  }, [queue])

  /** Enregistre une note : visible tout de suite, envoyée après 800 ms sans frappe. */
  const saveNote = useCallback((note: Note) => {
    const next = { ...note, updatedAt: new Date().toISOString() }
    setNotes((m) => ({ ...m, [cellKey(note.philosophy, note.topic)]: next }))
    queue.add({ kind: 'note', key: `note:${cellKey(note.philosophy, note.topic)}`, payload: next }, 800)
  }, [queue])

  return {
    ready, loadError, retryLoad: boot, sync, refresh,
    philosophies, topics, notes, statuses, history, filters, settings,
    patchPhilosophy, setFilters, setSettings, addDraw, resetHistory, setTopicActive, saveNote,
  }
}
