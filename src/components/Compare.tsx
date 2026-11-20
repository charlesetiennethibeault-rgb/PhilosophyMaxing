import { useMemo, useState } from 'react'
import Markdown from './Markdown'
import StatueNiche from './StatueNiche'
import { useData } from '../lib/DataContext'
import { topicsFor } from '../lib/draw'
import { href } from '../lib/route'
import { themeTopics } from '../lib/tools'
import { cellKey, type Note, type NoteStatus, type Philosophy, type Synthesis, type Topic } from '../lib/types'

interface Props {
  philosophies: Philosophy[]
  topics: Topic[]
  notes: Record<string, Note>
  syntheses: Record<string, Synthesis>
  params: URLSearchParams
  onParams: (patch: Record<string, string | undefined>) => void
}

const LABEL: Record<NoteStatus, string> = { empty: 'vide', draft: 'brouillon', deep: 'approfondi' }

function NoteBlock({ p, topic, note }: { p: Philosophy; topic: Topic; note?: Note }) {
  if (topic.scope === 'own' && topic.philosophy !== p.id) {
    return <p className="empty-inline">Ce sujet est propre à une autre philosophie : {p.name} n’en a pas.</p>
  }
  const status = note?.status ?? 'empty'
  if (!note || (!note.research.trim() && !note.reaction.trim())) {
    return (
      <div className="cmp-note">
        <p className="empty-inline">Pas encore de note sur ce sujet pour {p.name}.</p>
        <a className="btn btn-secondary btn-sm" href={href(['note', p.id, topic.id])}>Écrire cette note</a>
      </div>
    )
  }
  return (
    <div className="cmp-note">
      <p className="meta">État : {LABEL[status]} · <a href={href(['note', p.id, topic.id])}>Ouvrir la note</a></p>
      <h4>Recherche</h4>
      <Markdown text={note.research} />
      {note.sources.length > 0 && (
        <>
          <h4>Sources</h4>
          <ul>{note.sources.map((s, i) => (
            <li key={i}>{/^https?:\/\//i.test(s.url) ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a> : s.title} <span className="meta">({s.type})</span></li>
          ))}</ul>
        </>
      )}
      <h4>Ma réaction</h4>
      <Markdown text={note.reaction} />
    </div>
  )
}

export default function Compare({ philosophies, topics, notes, syntheses, params, onParams }: Props) {
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
    return [a, b].flatMap((id) => topicsFor(id, topics)).filter((t) => !seen.has(t.id) && seen.add(t.id))
  }, [a, b, topics])
  const topic = options.find((t) => t.id === params.get('sujet')) ?? options.find((t) => t.id === 'le-temps') ?? options[0]
  const theme = themes.find((t) => t.id === params.get('theme')) ?? themes[0]

  const column = (p: Philosophy | undefined) => {
    if (!p) return <p className="empty-inline">Choisis une philosophie.</p>
    if (scope === 'topic') {
      return topic ? <NoteBlock p={p} topic={topic} note={notes[cellKey(p.id, topic.id)]} /> : <p className="empty-inline">Aucun sujet disponible.</p>
    }
    const s = theme ? syntheses[`${p.id}|${theme.id}`] : undefined
    return (
      <div className="cmp-note">
        <h4>Synthèse du thème</h4>
        {s?.body.trim() ? <Markdown text={s.body} /> : <p className="empty-inline">Pas encore de synthèse pour ce thème.</p>}
        {theme && themeTopics(theme.id, topics).map((t) => (
          <details key={t.id}>
            <summary>{t.name} <span className="meta">({LABEL[notes[cellKey(p.id, t.id)]?.status ?? 'empty']})</span></summary>
            <NoteBlock p={p} topic={t} note={notes[cellKey(p.id, t.id)]} />
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
      <h1>Comparer</h1>
      <div className="toolbar">
        {select('Philosophie A', a, 'a')}
        {select('Philosophie B', b, 'b')}
        <fieldset className="seg-fieldset">
          <legend>Comparer sur</legend>
          <div className="seg-group">
            <label className={`seg${scope === 'topic' ? ' on' : ''}`}><input type="radio" name="scope" checked={scope === 'topic'} onChange={() => onParams({ portee: undefined })} />Un sujet</label>
            <label className={`seg${scope === 'theme' ? ' on' : ''}`}><input type="radio" name="scope" checked={scope === 'theme'} onChange={() => onParams({ portee: 'theme' })} />Un thème entier</label>
          </div>
        </fieldset>
        {scope === 'topic' ? (
          <label>Sujet
            <select value={topic?.id ?? ''} onChange={(e) => onParams({ sujet: e.target.value })}>
              {options.map((t) => <option key={t.id} value={t.id}>{t.name}{t.scope === 'own' ? ' (sujet propre)' : ''}</option>)}
            </select>
          </label>
        ) : (
          <label>Thème
            <select value={theme?.id ?? ''} onChange={(e) => onParams({ theme: e.target.value })}>
              {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="seg-group cmp-tabs" role="tablist" aria-label="Philosophie affichée">
        <button type="button" role="tab" aria-selected={col === 'a'} className={col === 'a' ? 'on' : ''} onClick={() => setCol('a')}>{pa?.name ?? 'A'}</button>
        <button type="button" role="tab" aria-selected={col === 'b'} className={col === 'b' ? 'on' : ''} onClick={() => setCol('b')}>{pb?.name ?? 'B'}</button>
      </div>

      <div className="cmp-cols">
        <section className={`cmp-col${col === 'a' ? ' show' : ''}`} aria-label={`Philosophie A : ${pa?.name ?? ''}`}>
          {pa && <StatueNiche philosophyId={pa.id} philosophyName={pa.name} />}
          <h2>{pa?.name}</h2>{column(pa)}
        </section>
        <section className={`cmp-col${col === 'b' ? ' show' : ''}`} aria-label={`Philosophie B : ${pb?.name ?? ''}`}>
          {pb && <StatueNiche philosophyId={pb.id} philosophyName={pb.name} />}
          <h2>{pb?.name}</h2>{column(pb)}
        </section>
      </div>
    </main>
  )
}
