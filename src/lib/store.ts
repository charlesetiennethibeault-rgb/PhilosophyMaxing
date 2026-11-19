import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  importBackup as importBackupDb, loadDraws, loadFamilies, loadNotes, loadPhilosophies, loadPrefs, loadSyntheses,
  loadThemes, loadTopics, philosophyToRow, seedIfNeeded, topicToRow, familyToRow, themeToRow,
} from './db'
import { SyncQueue, type Job, type SyncStatus } from './sync'
import type { Backup } from './backup'
import type { Draw, DrawSettings, Family, Filters, Note, NoteStatus, Philosophy, Synthesis, Theme, Topic } from './types'
import { cellKey } from './types'

type Table = 'families' | 'themes' | 'philosophies' | 'topics'

/** État de l'application, synchronisé avec Supabase (interface optimiste + file d'écritures). */
export function useAppState(userId: string) {
  const queue = useMemo(() => new SyncQueue(userId), [userId])
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sync, setSync] = useState<SyncStatus>(queue.status)

  const [families, setFamilies] = useState<Family[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [philosophies, setPhilosophies] = useState<Philosophy[]>([])
  const [schemaReady, setSchemaReady] = useState(true)
  const [topics, setTopics] = useState<Topic[]>([])
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [syntheses, setSyntheses] = useState<Record<string, Synthesis>>({})
  const [history, setHistory] = useState<Draw[]>([])
  const [settings, setSettingsState] = useState<DrawSettings>({ noRepeat: true, onlyRemaining: false, discovery: false, sound: true })
  const [filters, setFiltersState] = useState<Filters>({ families: [], eras: [], yearRange: null, regions: [], favoritesOnly: false, toVerifyOnly: false })
  const prefsRef = useRef({ settings, filters })
  prefsRef.current = { settings, filters }

  useEffect(() => queue.onStatus(setSync), [queue])

  const fetchData = useCallback(async () => {
    const [fa, th, ph, tp, nt, sy, dr] = await Promise.all([
      loadFamilies(), loadThemes(), loadPhilosophies(), loadTopics(), loadNotes(), loadSyntheses(), loadDraws(),
    ])
    setFamilies(fa); setThemes(th); setPhilosophies(ph.list); setSchemaReady(ph.schemaReady); setTopics(tp); setHistory(dr)
    setNotes(Object.fromEntries(nt.map((n) => [cellKey(n.philosophy, n.topic), n])))
    setSyntheses(Object.fromEntries(sy.map((s) => [`${s.philosophy}|${s.theme}`, s])))
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
    const flush = () => queue.flushNow()
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flush) }
  }, [queue])

  const statuses = useMemo(() => {
    const m: Record<string, NoteStatus> = {}
    for (const [k, n] of Object.entries(notes)) m[k] = n.status
    return m
  }, [notes])

  /* ----- fiches, réglages, tirages ----- */

  /** `delay` plus long pour la frappe (les textes personnels), court pour un simple clic. */
  const patchPhilosophy = useCallback((id: string, patch: Partial<Philosophy>, delay = 300) => {
    setPhilosophies((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    queue.add({ kind: 'philosophy', key: `ph:${id}`, payload: { id, patch } }, delay)
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

  const saveSynthesis = useCallback((s: Synthesis) => {
    const next = { ...s, updatedAt: new Date().toISOString() }
    setSyntheses((m) => ({ ...m, [`${s.philosophy}|${s.theme}`]: next }))
    queue.add({ kind: 'synthesis', key: `synth:${s.philosophy}|${s.theme}`, payload: next }, 800)
  }, [queue])

  /* ----- édition des listes (philosophies, sujets, familles, thèmes) ----- */

  const writeRow = useCallback((table: Table, id: string, row: Record<string, unknown>, delay = 300) => {
    queue.add({ kind: 'row', key: `row:${table}:${id}`, payload: { table, row } } as Job, delay)
  }, [queue])

  const savePhilosophy = useCallback((p: Philosophy) => {
    setPhilosophies((l) => (l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [...l, p]))
    queue.drop((j) => j.kind === 'philosophy' && j.payload.id === p.id) // la ligne complète remplace les petits patchs
    writeRow('philosophies', p.id, philosophyToRow(p))
  }, [queue, writeRow])

  const deletePhilosophy = useCallback((id: string) => {
    setPhilosophies((l) => l.filter((p) => p.id !== id))
    setTopics((l) => l.filter((t) => t.philosophy !== id))
    setNotes((m) => Object.fromEntries(Object.entries(m).filter(([, n]) => n.philosophy !== id)))
    setSyntheses((m) => Object.fromEntries(Object.entries(m).filter(([, s]) => s.philosophy !== id)))
    queue.drop((j) => (j.kind === 'note' && j.payload.philosophy === id) || (j.kind === 'synthesis' && j.payload.philosophy === id)
      || (j.kind === 'philosophy' && j.payload.id === id) || j.key === `row:philosophies:${id}` || j.key.startsWith(`row:topics:${id}--`)
      || (j.kind === 'draw' && j.payload.philosophy === id))
    queue.add({ kind: 'del', key: `del:philosophies:${id}`, payload: { table: 'philosophies', id } })
  }, [queue])

  const saveTopic = useCallback((t: Topic) => {
    setTopics((l) => (l.some((x) => x.id === t.id) ? l.map((x) => (x.id === t.id ? t : x)) : [...l, t]))
    queue.drop((j) => j.kind === 'topic' && j.payload.id === t.id)
    writeRow('topics', t.id, topicToRow(t))
  }, [queue, writeRow])

  const deleteTopic = useCallback((id: string) => {
    setTopics((l) => l.filter((t) => t.id !== id))
    setNotes((m) => Object.fromEntries(Object.entries(m).filter(([, n]) => n.topic !== id)))
    queue.drop((j) => (j.kind === 'note' && j.payload.topic === id) || (j.kind === 'topic' && j.payload.id === id) || j.key === `row:topics:${id}`)
    queue.add({ kind: 'del', key: `del:topics:${id}`, payload: { table: 'topics', id } })
  }, [queue])

  const saveFamily = useCallback((f: Family) => {
    setFamilies((l) => (l.some((x) => x.id === f.id) ? l.map((x) => (x.id === f.id ? f : x)) : [...l, f]))
    writeRow('families', f.id, familyToRow(f))
  }, [writeRow])
  const deleteFamily = useCallback((id: string) => {
    setFamilies((l) => l.filter((f) => f.id !== id))
    queue.drop((j) => j.key === `row:families:${id}`)
    queue.add({ kind: 'del', key: `del:families:${id}`, payload: { table: 'families', id } })
  }, [queue])

  const saveTheme = useCallback((t: Theme) => {
    setThemes((l) => (l.some((x) => x.id === t.id) ? l.map((x) => (x.id === t.id ? t : x)) : [...l, t]))
    writeRow('themes', t.id, themeToRow(t))
  }, [writeRow])
  const deleteTheme = useCallback((id: string) => {
    setThemes((l) => l.filter((t) => t.id !== id))
    setSyntheses((m) => Object.fromEntries(Object.entries(m).filter(([, s]) => s.theme !== id)))
    queue.drop((j) => j.key === `row:themes:${id}` || (j.kind === 'synthesis' && j.payload.theme === id))
    queue.add({ kind: 'del', key: `del:themes:${id}`, payload: { table: 'themes', id } })
  }, [queue])

  /** Réécrit l'ordre d'une liste après un déplacement. */
  const reorder = useCallback((table: Table, list: { id: string; order: number }[]) => {
    const apply = <T extends { id: string; order: number }>(l: T[]) => l.map((x) => ({ ...x, order: list.find((y) => y.id === x.id)?.order ?? x.order }))
    if (table === 'families') { const next = apply(families); setFamilies(next); next.forEach((f) => writeRow('families', f.id, familyToRow(f))) }
    if (table === 'themes') { const next = apply(themes); setThemes(next); next.forEach((t) => writeRow('themes', t.id, themeToRow(t))) }
    if (table === 'philosophies') { const next = apply(philosophies); setPhilosophies(next); next.forEach((p) => writeRow('philosophies', p.id, philosophyToRow(p))) }
    if (table === 'topics') { const next = apply(topics); setTopics(next); next.forEach((t) => writeRow('topics', t.id, topicToRow(t))) }
  }, [families, themes, philosophies, topics, writeRow])

  /** Import d'une sauvegarde JSON : met à jour les lignes de même identifiant, ne supprime rien. */
  const importData = useCallback(async (b: Backup) => {
    await queue.drain(4000)
    await importBackupDb(userId, b)
    await fetchData()
    setSettingsState(b.settings); setFiltersState(b.filters)
  }, [queue, userId, fetchData])

  const exportData = useCallback((): Omit<Backup, 'app' | 'version' | 'exportedAt'> => ({
    families, themes, philosophies, topics,
    notes: Object.values(notes), syntheses: Object.values(syntheses), draws: history,
    settings, filters,
  }), [families, themes, philosophies, topics, notes, syntheses, history, settings, filters])

  return {
    ready, loadError, retryLoad: boot, sync, refresh,
    families, themes, philosophies, schemaReady, topics, notes, syntheses, statuses, history, filters, settings,
    patchPhilosophy, setFilters, setSettings, addDraw, resetHistory, setTopicActive, saveNote, saveSynthesis,
    savePhilosophy, deletePhilosophy, saveTopic, deleteTopic, saveFamily, deleteFamily, saveTheme, deleteTheme,
    reorder, importData, exportData,
  }
}
