import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChartNoAxesColumn, CircleAlert, Check, Columns2, LogOut, SlidersHorizontal, Target, UserRound, Volume2, VolumeX, X } from 'lucide-react'
import Wheel, { type WheelHandle, type WheelItem } from './components/Wheel'
import EraStrip from './components/EraStrip'
import FiltersPanel from './components/FiltersPanel'
import PhilosophyCard from './components/PhilosophyCard'
import NoteView from './components/NoteView'
import Carnet, { type CarnetSub } from './components/Carnet'
import Compare from './components/Compare'
import Progress from './components/Progress'
import { DataProvider, useData } from './lib/DataContext'
import { useAppState } from './lib/store'
import type { AppState } from './lib/appState'
import { availableTopics, drawPhilosophy, drawTopic, emptyFilters, eraOf, progressOf, wheelPhilosophies, type DrawContext } from './lib/draw'
import { WHEEL_ERAS, erasForWheelEra, orderForWheel, wheelEraForFilters, wheelEraInfo, wheelEraOf, type WheelEra } from './lib/wheelEras'
import { cellKey, emptyNote, type Topic } from './lib/types'
import { RECORD_DRAWS } from './lib/config'
import { OWN, aplatColor } from './lib/ui'
import { chime } from './lib/audio'
import { href, useRoute } from './lib/route'
import { useLoadingIndicator } from './lib/loading'

const NAV = [
  { id: 'roue', label: 'Roue', Icon: Target },
  { id: 'carnet', label: 'Carnet', Icon: BookOpen },
  { id: 'comparer', label: 'Comparer', Icon: Columns2 },
  { id: 'progression', label: 'Progression', Icon: ChartNoAxesColumn },
] as const

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

function SyncStatus({ sync }: { sync: AppState['sync'] }) {
  if (sync === 'saved') return <span className="sync-status ok" role="status"><Check size={16} aria-hidden="true" /><span>Synchronisé</span></span>
  if (sync === 'pending') return <span className="sync-status" role="status"><span>Envoi…</span></span>
  return <span className="sync-status warn" role="status"><CircleAlert size={16} aria-hidden="true" /><span>Hors ligne</span></span>
}

const TITLES: Record<string, string> = { roue: 'Roue', carnet: 'Carnet', note: 'Note', comparer: 'Comparer', progression: 'Progression' }

function Workspace({ st, email, onSignOut }: { st: AppState; email: string; onSignOut: () => void }) {
  const reduced = useReducedMotion()
  const wheelRef = useRef<WheelHandle>(null)
  const { family } = useData()
  const { route, navigate, setParams, back } = useRoute()

  const view = (['roue', 'carnet', 'note', 'comparer', 'progression'] as const).find((v) => v === route.segments[0]) ?? 'roue'
  const carnetSub: CarnetSub = route.segments[1] === 'notes' ? 'notes' : route.segments[1] === 'historique' ? 'historique' : route.segments[1] === 'gerer' ? 'gerer' : 'philosophies'
  const ficheId = route.segments[1] === 'fiche' ? route.segments[2] ?? null : null

  const [mode, setMode] = useState<'philosophies' | 'topics'>('philosophies')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [topicItems, setTopicItems] = useState<Topic[]>([])
  const [live, setLive] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState<null | { text: string; action?: { label: string; run: () => void } }>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Titre de page, et focus sur le contenu à chaque changement d'écran (clavier et lecteurs d'écran).
  const first = useRef(true)
  useEffect(() => {
    document.title = `${TITLES[view]} · PhilosophyMaxing`
    if (first.current) { first.current = false; return }
    const m = document.querySelector('main') as HTMLElement | null
    m?.setAttribute('tabindex', '-1')
    m?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [route.segments[0], route.segments[1], route.segments[2]]) // eslint-disable-line react-hooks/exhaustive-deps

  // Avertit avant de quitter si des modifications ne sont pas encore envoyées.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (st.sync === 'error') { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [st.sync])

  // Retour sur l'onglet : on recharge depuis Supabase, sauf pendant l'écriture d'une note.
  const { refresh } = st
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === 'visible' && view !== 'note') void refresh() }
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [refresh, view])

  useEffect(() => {
    if (!drawerOpen) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [drawerOpen])

  const ctx: DrawContext = useMemo(
    () => ({ philosophies: st.philosophies, topics: st.topics, filters: st.filters, settings: st.settings, history: st.history, statuses: st.statuses }),
    [st.philosophies, st.topics, st.filters, st.settings, st.history, st.statuses],
  )

  // La roue évolue avec le temps : la période filtrée détermine la roue (meule, bois, charrette, fer, pneu).
  const wheelEra = wheelEraForFilters(st.filters.eras)
  const wheel = useMemo(() => orderForWheel(wheelPhilosophies(ctx), wheelEra), [ctx, wheelEra])
  const eraCounts = useMemo(() => {
    const out = {} as Record<WheelEra, number>
    for (const w of WHEEL_ERAS) out[w.id] = wheelPhilosophies({ ...ctx, filters: { ...ctx.filters, eras: erasForWheelEra(w.id) } }).length
    return out
  }, [ctx])
  const sortedAll = useMemo(() => [...st.philosophies].sort((a, b) => a.order - b.order), [st.philosophies])
  const current = st.philosophies.find((p) => p.id === currentId) ?? null
  const currentNumber = current ? sortedAll.findIndex((p) => p.id === current.id) + 1 : 0

  const phItems: WheelItem[] = useMemo(
    () => wheel.map((p) => ({ id: p.id, label: p.name, color: family(p.family).color })),
    [wheel, family],
  )
  const tpItems: WheelItem[] = useMemo(
    () => topicItems.map((t, i) => ({
      id: t.id,
      label: t.short,
      color: t.scope === 'own' ? OWN : aplatColor(family(current?.family ?? '').color, i % 2 ? 0.14 : 0),
      star: t.scope === 'own',
      status: st.statuses[cellKey(current?.id ?? '', t.id)] ?? 'empty',
    })),
    [topicItems, current, st.statuses, family],
  )
  const items = mode === 'philosophies' ? phItems : tpItems
  // Sur la roue des sujets, on garde la roue de la période de la philosophie tirée.
  const displayEra: WheelEra = mode === 'philosophies' ? wheelEra : current ? wheelEraOf(eraOf(current.startYear)) : 'all'

  useEffect(() => { setLive(''); setMessage(null) }, [mode, wheel.length])

  const exhaustedAction = (text: string, kind: 'no-match' | 'exhausted') =>
    setMessage(kind === 'no-match'
      ? { text, action: { label: 'Effacer les filtres', run: () => st.setFilters(emptyFilters) } }
      : { text, action: { label: 'Autoriser les cases déjà tirées', run: () => st.setSettings({ noRepeat: false, onlyRemaining: false }) } })

  const spin = useCallback((power = 0.6) => {
    if (wheelRef.current?.isSpinning()) return
    setMessage(null)
    if (mode === 'philosophies') {
      const r = drawPhilosophy(ctx)
      if (!r.ok) {
        exhaustedAction(
          r.reason === 'no-match'
            ? 'Aucune philosophie ne correspond à ces filtres. Retire un filtre pour élargir la roue.'
            : 'Toutes les cases ont déjà été tirées avec ces réglages. Autorise les cases déjà tirées pour continuer, ou réinitialise l’historique.',
          r.reason,
        )
        return
      }
      setSpinning(true); setSheetOpen(false)
      wheelRef.current?.spinTo(r.index, power)
    } else if (current) {
      const r = drawTopic(current.id, ctx)
      if (!r.ok) {
        exhaustedAction('Tous les sujets de cette philosophie ont déjà été tirés. Autorise les cases déjà tirées pour continuer, ou réinitialise l’historique.', 'exhausted')
        return
      }
      setTopicItems(r.wheel)
      setSpinning(true)
      // laisse React redessiner la roue avec la liste à jour avant de lancer
      requestAnimationFrame(() => wheelRef.current?.spinTo(r.index, power))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ctx, current])

  const onStop = (index: number) => {
    setSpinning(false)
    if (st.settings.sound) chime()
    if (mode === 'philosophies') {
      const p = wheel[index]
      if (!p) return
      setCurrentId(p.id); setSheetOpen(true)
      if (RECORD_DRAWS) st.addDraw({ type: 'philosophy', philosophy: p.id })
    } else if (current) {
      const t = topicItems[index]
      if (!t) return
      setSheetOpen(false)
      if (RECORD_DRAWS) st.addDraw({ type: 'topic', philosophy: current.id, topic: t.id })
      navigate(href(['note', current.id, t.id]))
    }
  }

  const goTopics = () => {
    if (!current) return
    const list = availableTopics(current.id, ctx)
    setTopicItems(list); setMode('topics'); setSheetOpen(false)
    if (list.length === 0) exhaustedAction('Tous les sujets de cette philosophie ont déjà été tirés. Autorise les cases déjà tirées pour continuer.', 'exhausted')
  }
  const backToPhilosophies = () => { setMode('philosophies'); setSheetOpen(false) }

  const hint = mode === 'philosophies' ? `${wheel.length} philosophie${wheel.length > 1 ? 's' : ''} sur la roue` : `Sujets de ${current?.name ?? ''}`
  const progress = current ? progressOf(current.id, st.topics, st.statuses) : { deep: 0, total: 0 }

  const noteP = view === 'note' ? st.philosophies.find((p) => p.id === route.segments[1]) : undefined
  const noteT = view === 'note' ? st.topics.find((t) => t.id === route.segments[2]) : undefined

  const side = (
    <aside className={`side${sheetOpen ? ' open' : ''}`} aria-label="Philosophie tirée" aria-live="polite">
      {current ? (
        <PhilosophyCard
          key={current.id}
          philosophy={current} number={currentNumber} total={sortedAll.length} progress={progress}
          onPatch={(patch) => st.patchPhilosophy(current.id, patch)}
          onTopicWheel={mode === 'philosophies' ? goTopics : undefined}
          onClose={() => setSheetOpen(false)}
        />
      ) : (
        <div className="empty empty-side">
          <h2>Aucune philosophie tirée</h2>
          <p>Appuie sur « Tirer une philosophie » : sa fiche s’affiche ici, avec ses dates, son fondateur et ses principaux acteurs. Tu choisis ensuite un sujet à explorer.</p>
        </div>
      )}
    </aside>
  )

  const noteMissing = view === 'note' && (!noteP || !noteT)

  return (
    <div className="app">
      {/* Filtre « encre » du carnet : ondule légèrement le tracé des titres manuscrits (design.md §12). */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <filter id="ink-wobble" x="-2%" y="-10%" width="104%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <a
        className="skip-link" href="#main"
        onClick={(e) => { e.preventDefault(); const m = document.querySelector('main') as HTMLElement | null; m?.setAttribute('tabindex', '-1'); m?.focus() }}
      >Aller au contenu</a>

      <header className="topbar">
        <a className="brand" href={href(['roue'])}>PhilosophyMaxing</a>
        <nav className="topnav" aria-label="Navigation principale">
          {NAV.map(({ id, label }) => (
            <a key={id} href={href([id])} aria-current={view === id || (view === 'note' && id === 'carnet') ? 'page' : undefined}>{label}</a>
          ))}
        </nav>
        <div className="topbar-right">
          <SyncStatus sync={st.sync} />
          <button
            type="button" className="icon-btn" aria-pressed={st.settings.sound}
            aria-label={st.settings.sound ? 'Couper le son de la roue' : 'Activer le son de la roue'}
            onClick={() => st.setSettings({ sound: !st.settings.sound })}
          >{st.settings.sound ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}</button>
          <a className="icon-btn desktop-only" href={href(['carnet', 'gerer', 'compte'])} aria-label="Compte" title={email}><UserRound size={20} aria-hidden="true" /></a>
          {view === 'roue' && (
            <button type="button" className="btn btn-secondary btn-sm filters-toggle" onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal size={16} aria-hidden="true" />Filtres
            </button>
          )}
        </div>
      </header>

      {noteMissing ? (
        <main className="screen" id="main">
          <div className="empty">
            <h1>Cette note est introuvable</h1>
            <p>La philosophie ou le sujet n’existe plus : il a peut-être été supprimé depuis Gérer.</p>
            <a className="btn btn-secondary" href={href(['roue'])}>Retour à la roue</a>
          </div>
        </main>
      ) : view === 'note' && noteP && noteT ? (
        <NoteView
          key={cellKey(noteP.id, noteT.id)}
          philosophy={noteP} topic={noteT}
          note={st.notes[cellKey(noteP.id, noteT.id)] ?? emptyNote(noteP.id, noteT.id)}
          sync={st.sync}
          onChange={st.saveNote}
          onBack={back}
        />
      ) : view === 'carnet' ? (
        <Carnet
          st={st} sub={carnetSub} section={route.segments[2]} ficheId={ficheId}
          query={route.params.get('q') ?? ''} onQuery={(q) => setParams({ q: q || undefined })}
          email={email} onSignOut={onSignOut}
        />
      ) : view === 'comparer' ? (
        <Compare philosophies={st.philosophies} topics={st.topics} notes={st.notes} syntheses={st.syntheses} params={route.params} onParams={setParams} />
      ) : view === 'progression' ? (
        <Progress philosophies={st.philosophies} topics={st.topics} statuses={st.statuses} />
      ) : (
        <main className="screen layout" id="main">
          <div className={`filters-col${drawerOpen ? ' open' : ''}`} role={drawerOpen ? 'dialog' : undefined} aria-label="Filtres et réglages">
            <div className="drawer-head">
              <h2>Filtres et réglages</h2>
              <button type="button" className="icon-btn" aria-label="Fermer les filtres" onClick={() => setDrawerOpen(false)}><X size={20} aria-hidden="true" /></button>
            </div>
            <FiltersPanel
              filters={st.filters} settings={st.settings}
              onFilters={st.setFilters} onSettings={st.setSettings}
              onResetHistory={st.resetHistory}
              wheelCount={wheel.length} historyCount={st.history.length}
            />
            <div className="drawer-account">
              <p className="meta">{email}</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onSignOut}><LogOut size={16} aria-hidden="true" />Me déconnecter</button>
            </div>
          </div>
          {drawerOpen && <div className="scrim" onClick={() => setDrawerOpen(false)} />}

          <section className="center" aria-label="Roue">
            {mode === 'philosophies' && (
              <EraStrip value={wheelEra} counts={eraCounts} onChange={(w) => st.setFilters({ ...st.filters, eras: erasForWheelEra(w) })} />
            )}
            <p className="stage-label" aria-live="off">{spinning || live ? live || '…' : hint}</p>
            <Wheel
              ref={wheelRef}
              items={items}
              era={displayEra}
              showLabels={mode === 'topics'}
              sound={st.settings.sound}
              reducedMotion={reduced}
              disabled={spinning}
              ariaLabel={mode === 'philosophies' ? `Roue des philosophies (${wheelEraInfo(displayEra).object}) : appuyer pour tourner` : `Roue des sujets (${wheelEraInfo(displayEra).object}) : appuyer pour tourner`}
              onLive={(i) => setLive(items[i]?.label ?? '')}
              onStop={onStop}
              onFlick={spin}
            />
            <div className="controls">
              <button
                type="button" disabled={spinning} onClick={() => spin(0.6)}
                className={`btn btn-lg ${mode === 'topics' || !current ? 'btn-primary' : 'btn-secondary'}`}
              >
                {mode === 'philosophies' ? (current ? 'Tirer une autre philosophie' : 'Tirer une philosophie') : 'Tirer un sujet'}
              </button>
              {mode === 'topics' && <button type="button" className="btn btn-secondary btn-lg" onClick={backToPhilosophies}>Changer de philosophie</button>}
            </div>
            {message && (
              <div className="message" role="alert">
                <p>{message.text}</p>
                <div className="message-actions">
                  {message.action && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { message.action!.run(); setMessage(null) }}>{message.action.label}</button>}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('Réinitialiser tout l’historique des tirages ?')) { st.resetHistory(); setMessage(null) } }}>Réinitialiser l’historique</button>
                </div>
              </div>
            )}
            {current && !sheetOpen && (
              <button type="button" className="btn btn-ghost btn-sm show-card" onClick={() => setSheetOpen(true)}>Voir la fiche : {current.name}</button>
            )}
          </section>

          {side}
        </main>
      )}

      <nav className="bottom-nav" aria-label="Navigation principale (téléphone)">
        {NAV.map(({ id, label, Icon }) => (
          <a key={id} href={href([id])} aria-current={view === id || (view === 'note' && id === 'carnet') ? 'page' : undefined}>
            <Icon size={20} aria-hidden="true" /><span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

function AppSkeleton() {
  return (
    <div className="app" aria-busy="true">
      <header className="topbar"><span className="brand">PhilosophyMaxing</span></header>
      <main className="screen layout skeleton-layout" id="main">
        <div className="filters-col"><div className="sk sk-line w60" /><div className="sk sk-line" /><div className="sk sk-line" /><div className="sk sk-line w80" /><div className="sk sk-line" /></div>
        <section className="center"><div className="sk sk-line w40 center-line" /><div className="sk sk-wheel" /><div className="sk sk-btn" /></section>
        <aside className="side"><div className="sk sk-head" /><div className="sk sk-line" /><div className="sk sk-line w80" /><div className="sk sk-line w60" /></aside>
      </main>
      <p className="sr-only" role="status">Chargement de ton carnet…</p>
    </div>
  )
}

export default function App({ userId, email, onSignOut }: { userId: string; email: string; onSignOut: () => void }) {
  const st = useAppState(userId)
  const showSkeleton = useLoadingIndicator(!st.ready && !st.loadError)

  if (st.loadError) {
    return (
      <main className="login" id="main">
        <h1>PhilosophyMaxing</h1>
        <div className="message" role="alert">
          <p><strong>Ton carnet n’a pas pu se charger.</strong></p>
          <p>{st.loadError}</p>
          <p className="meta">Vérifie ta connexion. Si le problème persiste, vérifie que le schéma SQL a été appliqué dans Supabase.</p>
          <div className="message-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void st.retryLoad()}>Réessayer</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onSignOut}>Me déconnecter</button>
          </div>
        </div>
      </main>
    )
  }
  if (!st.ready) return showSkeleton ? <AppSkeleton /> : <div className="app" aria-busy="true" />
  return (
    <DataProvider families={st.families} themes={st.themes}>
      <Workspace st={st} email={email} onSignOut={onSignOut} />
    </DataProvider>
  )
}
