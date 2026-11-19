import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Wheel, { type WheelHandle, type WheelItem } from './components/Wheel'
import FiltersPanel from './components/FiltersPanel'
import PhilosophyCard from './components/PhilosophyCard'
import TopicResult from './components/TopicResult'
import { useAppState } from './lib/store'
import { availableTopics, drawPhilosophy, drawTopic, emptyFilters, progressOf, wheelPhilosophies, type DrawContext } from './lib/draw'
import { cellKey, type Topic } from './lib/types'
import { familyById, familyIndex, OCHRE } from './lib/ui'

type Tab = 'roue' | 'carnet' | 'comparer' | 'progression'
const TABS: { id: Tab; label: string }[] = [
  { id: 'roue', label: 'Roue' },
  { id: 'carnet', label: 'Carnet' },
  { id: 'comparer', label: 'Comparer' },
  { id: 'progression', label: 'Progression' },
]

function useReducedMotion() {
  const [r, setR] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const h = () => setR(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return r
}

/** Assombrit légèrement une couleur pour alterner les parts voisines. */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c: number) => Math.round(c * (1 - amount))
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((c) => c.toString(16).padStart(2, '0')).join('')
}

export default function App() {
  const st = useAppState()
  const reduced = useReducedMotion()
  const wheelRef = useRef<WheelHandle>(null)

  const [tab, setTab] = useState<Tab>('roue')
  const [mode, setMode] = useState<'philosophies' | 'topics'>('philosophies')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [topicId, setTopicId] = useState<string | null>(null)
  const [topicItems, setTopicItems] = useState<Topic[]>([])
  const [live, setLive] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState<null | { text: string; action?: { label: string; run: () => void } }>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const ctx: DrawContext = useMemo(
    () => ({ philosophies: st.philosophies, topics: st.topics, filters: st.filters, settings: st.settings, history: st.history, statuses: st.statuses }),
    [st.philosophies, st.topics, st.filters, st.settings, st.history, st.statuses],
  )

  const wheel = useMemo(() => wheelPhilosophies(ctx), [ctx])
  const current = st.philosophies.find((p) => p.id === currentId) ?? null
  const topic = topicItems.find((t) => t.id === topicId) ?? st.topics.find((t) => t.id === topicId) ?? null

  const phItems: WheelItem[] = useMemo(
    () => wheel.map((p) => ({ id: p.id, label: p.name, color: familyById(p.family).color, pattern: familyIndex(p.family) % 9 })),
    [wheel],
  )
  const tpItems: WheelItem[] = useMemo(
    () => topicItems.map((t, i) => ({
      id: t.id,
      label: t.short,
      color: t.scope === 'own' ? OCHRE : shade(familyById(current?.family ?? 'antiquite').color, i % 2 ? 0.18 : 0),
      pattern: 0,
      star: t.scope === 'own',
      status: st.statuses[cellKey(current?.id ?? '', t.id)] ?? 'empty',
    })),
    [topicItems, current, st.statuses],
  )

  const items = mode === 'philosophies' ? phItems : tpItems

  useEffect(() => { setLive(''); setMessage(null) }, [mode, wheel.length])

  const exhaustedAction = (text: string, kind: 'no-match' | 'exhausted') =>
    setMessage(kind === 'no-match'
      ? { text, action: { label: 'Effacer les filtres', run: () => st.setFilters(emptyFilters) } }
      : { text, action: { label: 'Désactiver « ne pas retomber sur une case déjà tirée »', run: () => st.setSettings({ noRepeat: false, onlyRemaining: false }) } })

  const spin = useCallback((power = 0.6) => {
    if (wheelRef.current?.isSpinning()) return
    setMessage(null)
    if (mode === 'philosophies') {
      const r = drawPhilosophy(ctx)
      if (!r.ok) {
        exhaustedAction(
          r.reason === 'no-match'
            ? 'Aucune philosophie ne correspond à ces filtres.'
            : 'Il ne reste plus aucune case à tirer avec ces réglages. Tu peux désactiver l’option pour continuer, ou réinitialiser l’historique.',
          r.reason,
        )
        return
      }
      setSpinning(true); setSheetOpen(false)
      wheelRef.current?.spinTo(r.index, power)
    } else if (current) {
      const r = drawTopic(current.id, ctx)
      if (!r.ok) {
        exhaustedAction('Plus aucun sujet disponible pour cette philosophie avec ces réglages. Tu peux désactiver l’option « ne pas retomber sur une case déjà tirée », ou réinitialiser l’historique.', 'exhausted')
        return
      }
      setTopicItems(r.wheel); setTopicId(null)
      setSpinning(true)
      // laisse React redessiner la roue avec la liste à jour avant de lancer
      requestAnimationFrame(() => wheelRef.current?.spinTo(r.index, power))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ctx, current])

  const onStop = (index: number) => {
    setSpinning(false)
    if (mode === 'philosophies') {
      const p = wheel[index]
      if (!p) return
      setCurrentId(p.id); setTopicId(null); setSheetOpen(true)
      st.addDraw({ type: 'philosophy', philosophy: p.id })
    } else if (current) {
      const t = topicItems[index]
      if (!t) return
      setTopicId(t.id); setSheetOpen(true)
      st.addDraw({ type: 'topic', philosophy: current.id, topic: t.id })
    }
  }

  const goTopics = () => {
    if (!current) return
    const list = availableTopics(current.id, ctx)
    setTopicItems(list); setTopicId(null); setMode('topics'); setSheetOpen(false)
    if (list.length === 0) exhaustedAction('Plus aucun sujet disponible pour cette philosophie avec ces réglages.', 'exhausted')
  }
  const backToPhilosophies = () => { setMode('philosophies'); setTopicId(null); setSheetOpen(false) }

  const hint = mode === 'philosophies' ? 'Tourne la roue des philosophies' : `Roue des sujets · ${current?.name ?? ''}`
  const progress = current ? progressOf(current.id, st.topics, st.statuses) : { deep: 0, total: 0 }

  const side = (
    <aside className={`side${sheetOpen ? ' open' : ''}`} aria-live="polite">
      {mode === 'topics' && current && topic && topicId ? (
        <TopicResult
          philosophy={current} topic={topic}
          status={st.statuses[cellKey(current.id, topic.id)] ?? 'empty'}
          onStatus={(s) => st.setStatus(cellKey(current.id, topic.id), s)}
          onBack={backToPhilosophies}
          onAgain={goTopics}
        />
      ) : current ? (
        <PhilosophyCard
          philosophy={current} progress={progress}
          onPatch={(patch) => st.patchPhilosophy(current.id, patch)}
          onTopicWheel={mode === 'philosophies' ? goTopics : undefined}
          onClose={() => setSheetOpen(false)}
        />
      ) : (
        <div className="empty-card">
          <h2>Ta prochaine exploration</h2>
          <p>Tourne la roue : la philosophie tirée s’affichera ici, avec ses dates, son fondateur et ses principaux acteurs.</p>
        </div>
      )}
    </aside>
  )

  return (
    <div className="app">
      <header className="topbar">
        <h1>PhilosophyMaxing</h1>
        <button type="button" className="btn small filters-toggle" onClick={() => setDrawerOpen(true)}>Filtres</button>
      </header>

      {tab === 'roue' ? (
        <main className="layout">
          <div className={`filters-col${drawerOpen ? ' open' : ''}`}>
            <div className="drawer-head">
              <h2>Filtres et réglages</h2>
              <button type="button" className="icon-btn close" aria-label="Fermer les filtres" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            <FiltersPanel
              filters={st.filters} settings={st.settings}
              onFilters={st.setFilters} onSettings={st.setSettings}
              onResetHistory={st.resetHistory}
              wheelCount={wheel.length} historyCount={st.history.length}
            />
          </div>
          {drawerOpen && <div className="scrim" onClick={() => setDrawerOpen(false)} />}

          <section className="center" aria-label="Roue">
            <div className="live" aria-live="off">
              <span className="live-label">{spinning || live ? live || '…' : hint}</span>
            </div>
            <Wheel
              ref={wheelRef}
              items={items}
              showLabels={mode === 'topics'}
              sound={st.settings.sound}
              reducedMotion={reduced}
              disabled={spinning}
              ariaLabel={mode === 'philosophies' ? 'Roue des philosophies : appuyer pour tourner' : 'Roue des sujets : appuyer pour tourner'}
              onLive={(i) => setLive(items[i]?.label ?? '')}
              onStop={onStop}
              onFlick={spin}
            />
            <div className="controls">
              <button type="button" className="btn primary big" disabled={spinning} onClick={() => spin(0.6)}>
                {mode === 'philosophies' ? 'Tourner la roue' : 'Tourner la roue des sujets'}
              </button>
              {mode === 'topics' && <button type="button" className="btn" onClick={backToPhilosophies}>Retour aux philosophies</button>}
            </div>
            {message && (
              <div className="message" role="alert">
                <p>{message.text}</p>
                {message.action && <button type="button" className="btn small" onClick={() => { message.action!.run(); setMessage(null) }}>{message.action.label}</button>}
                <button type="button" className="btn small" onClick={() => { if (window.confirm('Réinitialiser tout l’historique des tirages ?')) { st.resetHistory(); setMessage(null) } }}>Réinitialiser l’historique</button>
              </div>
            )}
            {current && !sheetOpen && (
              <button type="button" className="btn small show-card" onClick={() => setSheetOpen(true)}>Voir la carte : {current.name}</button>
            )}
          </section>

          {side}
        </main>
      ) : (
        <main className="placeholder">
          <h2>{TABS.find((t) => t.id === tab)!.label}</h2>
          <p>Cette vue arrive à la phase 3.</p>
        </main>
      )}

      <nav className="bottom-nav" aria-label="Navigation principale">
        {TABS.map((t) => (
          <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
