import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChartNoAxesColumn, CircleAlert, Check, Columns2, Languages, LogOut, SlidersHorizontal, Target, UserRound, Volume2, VolumeX, X } from 'lucide-react'
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
import { WHEEL_ERAS, eraSelection, erasForWheelEra, orderForWheel, wheelEraForFilters, wheelEraOf, type WheelEra } from './lib/wheelEras'
import { cellKey, emptyNote, type Topic } from './lib/types'
import { RECORD_DRAWS } from './lib/config'
import { OWN, aplatColor } from './lib/ui'
import Monuments from './components/Monuments'
import { chime } from './lib/audio'
import { href, useRoute } from './lib/route'
import { useLoadingIndicator } from './lib/loading'
import { useLang, type MsgKey } from './i18n'
import { localizeFamily, localizePhilosophy, localizeTheme, localizeTopic } from './i18n/content'

const NAV: { id: 'roue' | 'carnet' | 'comparer' | 'progression'; label: MsgKey; Icon: typeof Target }[] = [
  { id: 'roue', label: 'nav.roue', Icon: Target },
  { id: 'carnet', label: 'nav.carnet', Icon: BookOpen },
  { id: 'comparer', label: 'nav.comparer', Icon: Columns2 },
  { id: 'progression', label: 'nav.progression', Icon: ChartNoAxesColumn },
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

function SyncStatus({ sync }: { sync: AppState['sync'] }) {
  const { t } = useLang()
  if (sync === 'saved') return <span className="sync-status ok" role="status"><Check size={16} aria-hidden="true" /><span>{t('sync.synced')}</span></span>
  if (sync === 'pending') return <span className="sync-status" role="status"><span>{t('sync.sending')}</span></span>
  return <span className="sync-status warn" role="status"><CircleAlert size={16} aria-hidden="true" /><span>{t('sync.offline')}</span></span>
}

/** Bascule français / anglais (le choix est gardé sur l'appareil). */
function LanguageToggle() {
  const { lang, setLang, t } = useLang()
  const target = lang === 'fr' ? 'en' : 'fr'
  return (
    <button
      type="button" className="icon-btn" lang={lang}
      aria-label={t('lang.switchTo')} title={target === 'en' ? 'English' : 'Français'}
      onClick={() => setLang(target)}
    ><Languages size={20} aria-hidden="true" /></button>
  )
}

/** `st` : données traduites pour l'affichage. `raw` : données telles qu'enregistrées (pour Gérer seulement). */
function Workspace({ st, raw, email, onSignOut }: { st: AppState; raw: AppState; email: string; onSignOut: () => void }) {
  const { t, lang } = useLang()
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
  const [message, setMessage] = useState<null | { text: MsgKey; action?: { label: MsgKey; run: () => void } }>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Titre de page, et focus sur le contenu à chaque changement d'écran (clavier et lecteurs d'écran).
  const first = useRef(true)
  useEffect(() => {
    document.title = `${t(`nav.${view}`)} · ${t('app.name')}`
  }, [view, lang, t])
  useEffect(() => {
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
    () => topicItems.map((x, i) => ({
      id: x.id,
      label: x.short,
      color: x.scope === 'own' ? OWN : aplatColor(family(current?.family ?? '').color, i % 2 ? 0.14 : 0),
      star: x.scope === 'own',
      status: st.statuses[cellKey(current?.id ?? '', x.id)] ?? 'empty',
    })),
    [topicItems, current, st.statuses, family],
  )
  const items = mode === 'philosophies' ? phItems : tpItems
  // Sur la roue des sujets, on garde la roue de la période de la philosophie tirée.
  const displayEra: WheelEra = mode === 'philosophies' ? wheelEra : current ? wheelEraOf(eraOf(current.startYear)) : 'all'

  useEffect(() => { setLive(''); setMessage(null) }, [mode, wheel.length])

  const exhaustedAction = (text: MsgKey, kind: 'no-match' | 'exhausted') =>
    setMessage(kind === 'no-match'
      ? { text, action: { label: 'common.clearFilters', run: () => st.setFilters(emptyFilters) } }
      : { text, action: { label: 'wheel.allowDrawn', run: () => st.setSettings({ noRepeat: false, onlyRemaining: false }) } })

  const spin = useCallback((power = 0.6) => {
    if (wheelRef.current?.isSpinning()) return
    setMessage(null)
    if (mode === 'philosophies') {
      const r = drawPhilosophy(ctx)
      if (!r.ok) {
        exhaustedAction(r.reason === 'no-match' ? 'wheel.noMatch' : 'wheel.exhausted', r.reason)
        return
      }
      setSpinning(true); setSheetOpen(false)
      wheelRef.current?.spinTo(r.index, power)
    } else if (current) {
      const r = drawTopic(current.id, ctx)
      if (!r.ok) {
        exhaustedAction('wheel.topicsExhausted', 'exhausted')
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
      const x = topicItems[index]
      if (!x) return
      setSheetOpen(false)
      if (RECORD_DRAWS) st.addDraw({ type: 'topic', philosophy: current.id, topic: x.id })
      navigate(href(['note', current.id, x.id]))
    }
  }

  const goTopics = () => {
    if (!current) return
    const list = availableTopics(current.id, ctx)
    setTopicItems(list); setMode('topics'); setSheetOpen(false)
    if (list.length === 0) exhaustedAction('wheel.topicsExhaustedShort', 'exhausted')
  }
  const backToPhilosophies = () => { setMode('philosophies'); setSheetOpen(false) }

  const hint = mode === 'philosophies' ? t('wheel.hintPhilosophies', { count: wheel.length }) : t('wheel.hintTopics', { name: current?.name ?? '' })
  const progress = current ? progressOf(current.id, st.topics, st.statuses) : { deep: 0, total: 0 }

  const noteP = view === 'note' ? st.philosophies.find((p) => p.id === route.segments[1]) : undefined
  const noteT = view === 'note' ? st.topics.find((x) => x.id === route.segments[2]) : undefined

  const side = (
    <aside className={`side${sheetOpen ? ' open' : ''}`} aria-label={t('wheel.drawnAside')} aria-live="polite">
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
          <h2>{t('wheel.noneTitle')}</h2>
          <p>{t('wheel.noneText')}</p>
        </div>
      )}
    </aside>
  )

  const noteMissing = view === 'note' && (!noteP || !noteT)
  const wheelObject = t(`era.${displayEra}.object`)

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
      >{t('common.skipToContent')}</a>

      <header className="topbar">
        <a className="brand" href={href(['roue'])}>{t('app.name')}</a>
        <nav className="topnav" aria-label={t('nav.main')}>
          {NAV.map(({ id, label }) => (
            <a key={id} href={href([id])} aria-current={view === id || (view === 'note' && id === 'carnet') ? 'page' : undefined}>{t(label)}</a>
          ))}
        </nav>
        <div className="topbar-right">
          <SyncStatus sync={st.sync} />
          <LanguageToggle />
          <button
            type="button" className="icon-btn" aria-pressed={st.settings.sound}
            aria-label={st.settings.sound ? t('sound.mute') : t('sound.unmute')}
            onClick={() => st.setSettings({ sound: !st.settings.sound })}
          >{st.settings.sound ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}</button>
          <a className="icon-btn desktop-only" href={href(['carnet', 'gerer', 'compte'])} aria-label={t('nav.account')} title={email}><UserRound size={20} aria-hidden="true" /></a>
          {view === 'roue' && (
            <button type="button" className="btn btn-secondary btn-sm filters-toggle" onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal size={16} aria-hidden="true" />{t('nav.filters')}
            </button>
          )}
        </div>
      </header>

      {noteMissing ? (
        <main className="screen" id="main">
          <div className="empty">
            <h1>{t('wheel.noteMissingTitle')}</h1>
            <p>{t('wheel.noteMissingText')}</p>
            <a className="btn btn-secondary" href={href(['roue'])}>{t('common.backToWheel')}</a>
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
          st={st} raw={raw} sub={carnetSub} section={route.segments[2]} ficheId={ficheId}
          query={route.params.get('q') ?? ''} onQuery={(q) => setParams({ q: q || undefined })}
          email={email} onSignOut={onSignOut}
        />
      ) : view === 'comparer' ? (
        <Compare philosophies={st.philosophies} topics={st.topics} notes={st.notes} syntheses={st.syntheses} params={route.params} onParams={setParams} />
      ) : view === 'progression' ? (
        <Progress philosophies={st.philosophies} topics={st.topics} statuses={st.statuses} />
      ) : (
        <main className="screen layout" id="main">
          <div className={`filters-col${drawerOpen ? ' open' : ''}`} role={drawerOpen ? 'dialog' : undefined} aria-label={t('filters.dialog')}>
            <div className="drawer-head">
              <h2>{t('filters.dialog')}</h2>
              <button type="button" className="icon-btn" aria-label={t('filters.close')} onClick={() => setDrawerOpen(false)}><X size={20} aria-hidden="true" /></button>
            </div>
            <FiltersPanel
              filters={st.filters} settings={st.settings}
              onFilters={st.setFilters} onSettings={st.setSettings}
              onResetHistory={st.resetHistory}
              wheelCount={wheel.length} historyCount={st.history.length} hideEra
            />
            <div className="drawer-account">
              <p className="meta">{email}</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onSignOut}><LogOut size={16} aria-hidden="true" />{t('common.signOut')}</button>
            </div>
          </div>
          {drawerOpen && <div className="scrim" onClick={() => setDrawerOpen(false)} />}

          <section className="center" aria-label={t('wheel.section')}>
            {mode === 'philosophies' && (
              <EraStrip value={eraSelection(st.filters.eras)} counts={eraCounts} onChange={(w) => st.setFilters({ ...st.filters, eras: erasForWheelEra(w) })} />
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
              ariaLabel={t(mode === 'philosophies' ? 'wheel.ariaPhilosophies' : 'wheel.ariaTopics', { object: wheelObject })}
              onLive={(i) => setLive(items[i]?.label ?? '')}
              onStop={onStop}
              onFlick={spin}
            />
            <div className="controls">
              <button
                type="button" disabled={spinning} onClick={() => spin(0.6)}
                className={`btn btn-lg ${mode === 'topics' || !current ? 'btn-primary' : 'btn-secondary'}`}
              >
                {mode === 'philosophies' ? (current ? t('wheel.drawAnother') : t('wheel.drawPhilosophy')) : t('wheel.drawTopic')}
              </button>
              {mode === 'topics' && <button type="button" className="btn btn-secondary btn-lg" onClick={backToPhilosophies}>{t('wheel.changePhilosophy')}</button>}
            </div>
            {message && (
              <div className="message" role="alert">
                <p>{t(message.text)}</p>
                <div className="message-actions">
                  {message.action && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { message.action!.run(); setMessage(null) }}>{t(message.action.label)}</button>}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm(t('wheel.resetConfirm'))) { st.resetHistory(); setMessage(null) } }}>{t('wheel.resetHistory')}</button>
                </div>
              </div>
            )}
            {current && !sheetOpen && (
              <button type="button" className="btn btn-ghost btn-sm show-card" onClick={() => setSheetOpen(true)}>{t('wheel.viewEntry', { name: current.name })}</button>
            )}
          </section>

          {side}
        </main>
      )}

      <Monuments />

      <nav className="bottom-nav" aria-label={t('nav.mainPhone')}>
        {NAV.map(({ id, label, Icon }) => (
          <a key={id} href={href([id])} aria-current={view === id || (view === 'note' && id === 'carnet') ? 'page' : undefined}>
            <Icon size={20} aria-hidden="true" /><span>{t(label)}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

function AppSkeleton() {
  const { t } = useLang()
  return (
    <div className="app" aria-busy="true">
      <header className="topbar"><span className="brand">{t('app.name')}</span></header>
      <main className="screen layout skeleton-layout" id="main">
        <div className="filters-col"><div className="sk sk-line w60" /><div className="sk sk-line" /><div className="sk sk-line" /><div className="sk sk-line w80" /><div className="sk sk-line" /></div>
        <section className="center"><div className="sk sk-line w40 center-line" /><div className="sk sk-wheel" /><div className="sk sk-btn" /></section>
        <aside className="side"><div className="sk sk-head" /><div className="sk sk-line" /><div className="sk sk-line w80" /><div className="sk sk-line w60" /></aside>
      </main>
      <p className="sr-only" role="status">{t('load.notebook')}</p>
    </div>
  )
}

export default function App({ userId, email, onSignOut }: { userId: string; email: string; onSignOut: () => void }) {
  const { t, lang } = useLang()
  const st = useAppState(userId)
  const showSkeleton = useLoadingIndicator(!st.ready && !st.loadError)

  // Textes traduits pour l'affichage. Les données enregistrées (`st`) ne sont jamais modifiées.
  const philosophies = useMemo(() => st.philosophies.map((p) => localizePhilosophy(p, lang)), [st.philosophies, lang])
  const topics = useMemo(() => st.topics.map((x) => localizeTopic(x, lang)), [st.topics, lang])
  const families = useMemo(() => st.families.map((f) => localizeFamily(f, lang)), [st.families, lang])
  const themes = useMemo(() => st.themes.map((x) => localizeTheme(x, lang)), [st.themes, lang])
  const view: AppState = { ...st, philosophies, topics, families, themes }

  if (st.loadError) {
    return (
      <main className="login" id="main">
        <h1>{t('app.name')}</h1>
        <div className="message" role="alert">
          <p><strong>{t('load.failedTitle')}</strong></p>
          <p>{st.loadError}</p>
          <p className="meta">{t('load.failedHint')}</p>
          <div className="message-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void st.retryLoad()}>{t('common.retry')}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onSignOut}>{t('common.signOut')}</button>
          </div>
        </div>
      </main>
    )
  }
  if (!st.ready) return showSkeleton ? <AppSkeleton /> : <div className="app" aria-busy="true" />
  return (
    <DataProvider families={view.families} themes={view.themes}>
      <Workspace st={view} raw={st} email={email} onSignOut={onSignOut} />
    </DataProvider>
  )
}
