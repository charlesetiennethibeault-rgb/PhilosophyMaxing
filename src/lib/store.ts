import { useCallback, useEffect, useMemo, useState } from 'react'
import { allTopics, philosophies as seedPhilosophies } from './seed'
import { emptyFilters } from './draw'
import type { Draw, DrawSettings, Filters, NoteStatus, Philosophy, Topic } from './types'

// Phase 1 : tout vit dans le stockage local du navigateur. Supabase arrive en phase 2.
const KEY = 'philosophymaxing.v1'

interface Persisted {
  phState: Record<string, Partial<Pick<Philosophy, 'favorite' | 'reserve' | 'aVerifier'>>>
  topicActive: Record<string, boolean>
  history: Draw[]
  statuses: Record<string, NoteStatus>
  filters: Filters
  settings: DrawSettings
}

const defaults: Persisted = {
  phState: {},
  topicActive: {},
  history: [],
  statuses: {},
  filters: emptyFilters,
  settings: { noRepeat: true, onlyRemaining: false, discovery: false, sound: true },
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults
    const p = JSON.parse(raw) as Partial<Persisted>
    return {
      ...defaults, ...p,
      filters: { ...emptyFilters, ...p.filters },
      settings: { ...defaults.settings, ...p.settings },
    }
  } catch {
    return defaults
  }
}

export function useAppState() {
  const [state, setState] = useState<Persisted>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* stockage indisponible */ }
  }, [state])

  const philosophies: Philosophy[] = useMemo(
    () => seedPhilosophies.map((p) => ({ ...p, ...state.phState[p.id] })),
    [state.phState],
  )
  const topics: Topic[] = useMemo(
    () => allTopics.map((t) => (t.id in state.topicActive ? { ...t, active: state.topicActive[t.id] } : t)),
    [state.topicActive],
  )

  const patchPhilosophy = useCallback((id: string, patch: Partial<Pick<Philosophy, 'favorite' | 'reserve' | 'aVerifier'>>) =>
    setState((s) => ({ ...s, phState: { ...s.phState, [id]: { ...s.phState[id], ...patch } } })), [])
  const setFilters = useCallback((filters: Filters) => setState((s) => ({ ...s, filters })), [])
  const setSettings = useCallback((patch: Partial<DrawSettings>) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })), [])
  const addDraw = useCallback((d: Omit<Draw, 'at'>) =>
    setState((s) => ({ ...s, history: [...s.history, { ...d, at: new Date().toISOString() }] })), [])
  const resetHistory = useCallback(() => setState((s) => ({ ...s, history: [] })), [])
  const setStatus = useCallback((key: string, status: NoteStatus) =>
    setState((s) => ({ ...s, statuses: { ...s.statuses, [key]: status } })), [])
  const setTopicActive = useCallback((id: string, active: boolean) =>
    setState((s) => ({ ...s, topicActive: { ...s.topicActive, [id]: active } })), [])

  return {
    philosophies, topics, history: state.history, statuses: state.statuses,
    filters: state.filters, settings: state.settings,
    patchPhilosophy, setFilters, setSettings, addDraw, resetHistory, setStatus, setTopicActive,
  }
}
