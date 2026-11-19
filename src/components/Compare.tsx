import { useMemo, useState } from 'react'
import Markdown from './Markdown'
import { useData } from '../lib/DataContext'
import { topicsFor } from '../lib/draw'
import { themeTopics } from '../lib/tools'
import { cellKey, type Note, type NoteStatus, type Philosophy, type Synthesis, type Topic } from '../lib/types'

interface Props {
  philosophies: Philosophy[]
  topics: Topic[]
  notes: Record<string, Note>
  syntheses: Record<string, Synthesis>
  onOpenNote: (philosophyId: string, topicId: string) => void
}

const LABEL: Record<NoteStatus, string> = { empty: 'vide', draft: 'brouillon', deep: 'approfondi' }

function NoteBlock({ p, topic, note, onOpen }: { p: Philosophy; topic: Topic; note?: Note; onOpen: () => void }) {
  if (topic.scope === 'own' && topic.philosophy !== p.id) {
    return <p className="md-empty">Ce sujet est propre à une autre philosophie : {p.name} n’en a pas.</p>
  }
  const status = note?.status ?? 'empty'
  return (
    <div className="cmp-note">
      <p className="plist-sub">État : {LABEL[status]} · <button type="button" className="link inline" onClick={onOpen}>Ouvrir la note</button></p>
      <h4>Recherche</h4><Markdown text={note?.research ?? ''} />
      {note && note.sources.length > 0 && (
        <>
          <h4>Sources</h4>
          <ul>{note.sources.map((s, i) => (
            <li key={i}>{/^https?:\/\//i.test(s.url) ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a> : s.title} <span className="plist-sub">({s.type})</span></li>
          ))}</ul>
        </>
      )}
      <h4>Ma réaction</h4><Markdown text={note?.reaction ?? ''} />
    </div>
  )
}

export default function Compare({ philosophies, topics, notes, syntheses, onOpenNote }: Props) {
  const { themes } = useData()
  const [a, setA] = useState('stoicisme')
  const [b, setB] = useState('epicurisme')
  const [scope, setScope] = useState<'topic' | 'theme'>('topic')
  const [topicId, setTopicId] = useState('le-temps')
  const [themeId, setThemeId] = useState(themes[0]?.id ?? '')
  const [col, setCol] = useState<'a' | 'b'>('a')

  const pa = philosophies.find((p) => p.id === a)
  const pb = philosophies.find((p) => p.id === b)
  // sujets proposés : tous les communs actifs, plus les propres à l'une ou l'autre philosophie
  const options = useMemo(() => {
    const ids = [a, b]
    const seen = new Set<string>()
    return ids.flatMap((id) => topicsFor(id, topics)).filter((t) => !seen.has(t.id) && seen.add(t.id))
  }, [a, b, topics])
  const topic = options.find((t) => t.id === topicId) ?? options[0]
  const theme = themes.find((t) => t.id === themeId) ?? themes[0]

  const column = (p: Philosophy | undefined) => {
    if (!p) return <p className="md-empty">Choisis une philosophie.</p>
    if (scope === 'topic') {
      return topic
        ? <NoteBlock p={p} topic={topic} note={notes[cellKey(p.id, topic.id)]} onOpen={() => onOpenNote(p.id, topic.id)} />
        : <p className="md-empty">Aucun sujet.</p>
    }
    const s = theme ? syntheses[`${p.id}|${theme.id}`] : undefined
    return (
      <div className="cmp-note">
        <h4>Synthèse du thème</h4>
        <Markdown text={s?.body ?? ''} />
        {theme && themeTopics(theme.id, topics).map((t) => (
          <details key={t.id}>
            <summary>{t.name} <span className="plist-sub">({LABEL[notes[cellKey(p.id, t.id)]?.status ?? 'empty']})</span></summary>
            <NoteBlock p={p} topic={t} note={notes[cellKey(p.id, t.id)]} onOpen={() => onOpenNote(p.id, t.id)} />
          </details>
        ))}
      </div>
    )
  }

  const philSelect = (label: string, value: string, onChange: (v: string) => void) => (
    <label>{label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {philosophies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
  )

  return (
    <main className="compare">
      <h2>Comparer</h2>
      <div className="cmp-controls">
        {philSelect('Philosophie A', a, setA)}
        {philSelect('Philosophie B', b, setB)}
        <fieldset className="statuses">
          <legend>Comparer sur</legend>
          <label className={`seg${scope === 'topic' ? ' on' : ''}`}><input type="radio" name="scope" checked={scope === 'topic'} onChange={() => setScope('topic')} />Un sujet</label>
          <label className={`seg${scope === 'theme' ? ' on' : ''}`}><input type="radio" name="scope" checked={scope === 'theme'} onChange={() => setScope('theme')} />Un thème entier</label>
        </fieldset>
        {scope === 'topic' ? (
          <label>Sujet
            <select value={topic?.id ?? ''} onChange={(e) => setTopicId(e.target.value)}>
              {options.map((t) => <option key={t.id} value={t.id}>{t.scope === 'own' ? '★ ' : ''}{t.name}</option>)}
            </select>
          </label>
        ) : (
          <label>Thème
            <select value={theme?.id ?? ''} onChange={(e) => setThemeId(e.target.value)}>
              {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="tabs cmp-tabs" role="tablist" aria-label="Philosophie affichée">
        <button type="button" role="tab" aria-selected={col === 'a'} className={col === 'a' ? 'on' : ''} onClick={() => setCol('a')}>{pa?.name ?? 'A'}</button>
        <button type="button" role="tab" aria-selected={col === 'b'} className={col === 'b' ? 'on' : ''} onClick={() => setCol('b')}>{pb?.name ?? 'B'}</button>
      </div>

      <div className="cmp-cols">
        <section className={`cmp-col${col === 'a' ? ' show' : ''}`} aria-label={`Philosophie A : ${pa?.name ?? ''}`}>
          <h3>{pa?.name}</h3>{column(pa)}
        </section>
        <section className={`cmp-col${col === 'b' ? ' show' : ''}`} aria-label={`Philosophie B : ${pb?.name ?? ''}`}>
          <h3>{pb?.name}</h3>{column(pb)}
        </section>
      </div>
    </main>
  )
}
