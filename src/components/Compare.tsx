import { useMemo, useState } from 'react'
import Markdown from './Markdown'
import StatueNiche from './StatueNiche'
import { useData } from '../lib/DataContext'
import { topicsFor } from '../lib/draw'
import { useLang } from '../i18n'
import { href } from '../lib/route'
import { themeTopics } from '../lib/tools'
import { cellKey, type Note, type Philosophy, type Synthesis, type Topic } from '../lib/types'

interface Props {
  philosophies: Philosophy[]
  topics: Topic[]
  notes: Record<string, Note>
  syntheses: Record<string, Synthesis>
  params: URLSearchParams
  onParams: (patch: Record<string, string | undefined>) => void
}

function NoteBlock({ p, topic, note }: { p: Philosophy; topic: Topic; note?: Note }) {
  const { t, tRich } = useLang()
  if (topic.scope === 'own' && topic.philosophy !== p.id) {
    return <p className="empty-inline">{t('cmp.notTheirs', { name: p.name })}</p>
  }
  const status = note?.status ?? 'empty'
  if (!note || (!note.research.trim() && !note.reaction.trim())) {
    return (
      <div className="cmp-note">
        <p className="empty-inline">{t('cmp.notYet', { name: p.name })}</p>
        <a className="btn btn-secondary btn-sm" href={href(['note', p.id, topic.id])}>{t('cmp.writeNote')}</a>
      </div>
    )
  }
  return (
    <div className="cmp-note">
      <p className="meta">{tRich('cmp.state', { status: t(`status.${status}`) }, { a: (c) => <a href={href(['note', p.id, topic.id])}>{c}</a> })}</p>
      <h4>{t('cmp.research')}</h4>
      <Markdown text={note.research} />
      {note.sources.length > 0 && (
        <>
          <h4>{t('cmp.sources')}</h4>
          <ul>{note.sources.map((s, i) => (
            <li key={i}>{/^https?:\/\//i.test(s.url) ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a> : s.title} <span className="meta">({t(`sourceType.${s.type}`)})</span></li>
          ))}</ul>
        </>
      )}
      <h4>{t('cmp.reaction')}</h4>
      <Markdown text={note.reaction} />
    </div>
  )
}

export default function Compare({ philosophies, topics, notes, syntheses, params, onParams }: Props) {
  const { t } = useLang()
  const { themes } = useData()
  const a = params.get('a') ?? 'stoicisme'
  const b = params.get('b') ?? 'epicurisme'
  const scope = params.get('portee') === 'theme' ? 'theme' : 'topic'
  const [col, setCol] = useState<'a' | 'b'>('a')

  const pa = philosophies.find((p) => p.id === a)
  const pb = philosophies.find((p) => p.id === b)
  // sujets proposés : tous les communs actifs, plus les propres à l'une ou l'autre philosophie
  const options = useMemo(() => {
    const seen = new Set<string>()
    return [a, b].flatMap((id) => topicsFor(id, topics)).filter((x) => !seen.has(x.id) && seen.add(x.id))
  }, [a, b, topics])
  const topic = options.find((x) => x.id === params.get('sujet')) ?? options.find((x) => x.id === 'le-temps') ?? options[0]
  const theme = themes.find((x) => x.id === params.get('theme')) ?? themes[0]

  const column = (p: Philosophy | undefined) => {
    if (!p) return <p className="empty-inline">{t('cmp.choose')}</p>
    if (scope === 'topic') {
      return topic ? <NoteBlock p={p} topic={topic} note={notes[cellKey(p.id, topic.id)]} /> : <p className="empty-inline">{t('cmp.noTopic')}</p>
    }
    const s = theme ? syntheses[`${p.id}|${theme.id}`] : undefined
    return (
      <div className="cmp-note">
        <h4>{t('entry.themeSynthesis')}</h4>
        {s?.body.trim() ? <Markdown text={s.body} /> : <p className="empty-inline">{t('cmp.noSynthesis')}</p>}
        {theme && themeTopics(theme.id, topics).map((x) => (
          <details key={x.id}>
            <summary>{x.name} <span className="meta">({t(`status.${notes[cellKey(p.id, x.id)]?.status ?? 'empty'}`)})</span></summary>
            <NoteBlock p={p} topic={x} note={notes[cellKey(p.id, x.id)]} />
          </details>
        ))}
      </div>
    )
  }

  const select = (label: string, value: string, key: string) => (
    <label>{label}
      <select value={value} onChange={(e) => onParams({ [key]: e.target.value })}>
        {philosophies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
  )

  return (
    <main className="screen compare" id="main">
      <h1>{t('nav.comparer')}</h1>
      <div className="toolbar">
        {select(t('cmp.a'), a, 'a')}
        {select(t('cmp.b'), b, 'b')}
        <fieldset className="seg-fieldset">
          <legend>{t('cmp.on')}</legend>
          <div className="seg-group">
            <label className={`seg${scope === 'topic' ? ' on' : ''}`}><input type="radio" name="scope" checked={scope === 'topic'} onChange={() => onParams({ portee: undefined })} />{t('cmp.oneTopic')}</label>
            <label className={`seg${scope === 'theme' ? ' on' : ''}`}><input type="radio" name="scope" checked={scope === 'theme'} onChange={() => onParams({ portee: 'theme' })} />{t('cmp.wholeTheme')}</label>
          </div>
        </fieldset>
        {scope === 'topic' ? (
          <label>{t('cmp.topic')}
            <select value={topic?.id ?? ''} onChange={(e) => onParams({ sujet: e.target.value })}>
              {options.map((x) => <option key={x.id} value={x.id}>{x.name}{x.scope === 'own' ? t('cmp.ownSuffix') : ''}</option>)}
            </select>
          </label>
        ) : (
          <label>{t('cmp.theme')}
            <select value={theme?.id ?? ''} onChange={(e) => onParams({ theme: e.target.value })}>
              {themes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="seg-group cmp-tabs" role="tablist" aria-label={t('cmp.shown')}>
        <button type="button" role="tab" aria-selected={col === 'a'} className={col === 'a' ? 'on' : ''} onClick={() => setCol('a')}>{pa?.name ?? 'A'}</button>
        <button type="button" role="tab" aria-selected={col === 'b'} className={col === 'b' ? 'on' : ''} onClick={() => setCol('b')}>{pb?.name ?? 'B'}</button>
      </div>

      <div className="cmp-cols">
        <section className={`cmp-col${col === 'a' ? ' show' : ''}`} aria-label={t('cmp.colA', { name: pa?.name ?? '' })}>
          {pa && <StatueNiche philosophy={pa} />}
          <h2>{pa?.name}</h2>{column(pa)}
        </section>
        <section className={`cmp-col${col === 'b' ? ' show' : ''}`} aria-label={t('cmp.colB', { name: pb?.name ?? '' })}>
          {pb && <StatueNiche philosophy={pb} />}
          <h2>{pb?.name}</h2>{column(pb)}
        </section>
      </div>
    </main>
  )
}
