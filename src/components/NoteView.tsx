import { useState } from 'react'
import MdField from './MdField'
import { useData } from '../lib/DataContext'
import { ownLabel } from '../lib/ui'
import type { SyncStatus } from '../lib/sync'
import type { Note, NoteStatus, Philosophy, Source, SourceType, Topic } from '../lib/types'

interface Props {
  philosophy: Philosophy
  topic: Topic
  note: Note
  sync: SyncStatus
  onChange: (n: Note) => void
  onBack: () => void
}

const STATUS_LABELS: Record<NoteStatus, string> = { empty: 'Vide', draft: 'Brouillon', deep: 'Approfondi' }
const SOURCE_TYPES: { id: SourceType; label: string }[] = [
  { id: 'livre', label: 'Livre' }, { id: 'article', label: 'Article' }, { id: 'video', label: 'Vidéo' },
]
const SYNC_LABELS: Record<SyncStatus, string> = {
  saved: 'Enregistré', pending: 'Enregistrement…', error: 'Erreur réseau : copie gardée ici, nouvelle tentative',
}

function SourcesEditor({ sources, onChange }: { sources: Source[]; onChange: (s: Source[]) => void }) {
  const set = (i: number, patch: Partial<Source>) => onChange(sources.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const isUrl = (u: string) => /^https?:\/\//i.test(u)
  return (
    <section className="sources">
      <h3>Sources et liens</h3>
      {sources.length === 0 && <p className="md-empty">Aucune source pour l’instant.</p>}
      <ul>
        {sources.map((s, i) => (
          <li key={i}>
            <input aria-label={`Titre de la source ${i + 1}`} placeholder="Titre" value={s.title} onChange={(e) => set(i, { title: e.target.value })} />
            <input aria-label={`Adresse de la source ${i + 1}`} placeholder="https://…" inputMode="url" value={s.url} onChange={(e) => set(i, { url: e.target.value })} />
            <select aria-label={`Type de la source ${i + 1}`} value={s.type} onChange={(e) => set(i, { type: e.target.value as SourceType })}>
              {SOURCE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {isUrl(s.url) && <a href={s.url} target="_blank" rel="noopener noreferrer" className="open">Ouvrir ↗</a>}
            <button type="button" className="icon-btn" aria-label={`Supprimer la source ${i + 1}`} onClick={() => onChange(sources.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn small" onClick={() => onChange([...sources, { title: '', url: '', type: 'livre' }])}>Ajouter une source</button>
    </section>
  )
}

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim().replace(/,$/, '')
    if (t && !tags.includes(t)) onChange([...tags, t])
    setDraft('')
  }
  return (
    <div className="tags">
      {tags.map((t) => (
        <span key={t} className="tag">{t}<button type="button" aria-label={`Retirer l’étiquette ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>×</button></span>
      ))}
      <input
        aria-label="Ajouter une étiquette" placeholder="Ajouter une étiquette" value={draft}
        onChange={(e) => setDraft(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
      />
    </div>
  )
}

export default function NoteView({ philosophy, topic, note, sync, onChange, onBack }: Props) {
  const { themes } = useData()
  const own = topic.scope === 'own'
  const theme = themes.find((t) => t.id === topic.theme)
  const question = topic.question.replace('[philosophie]', philosophy.name.replace(/ \(.*\)$/, ''))
  const set = (patch: Partial<Note>) => onChange({ ...note, ...patch })

  return (
    <main className={`noteview${own ? ' own' : ''}`}>
      <div className="note-top">
        <button type="button" className="btn small" onClick={onBack}>← Retour à la roue</button>
        <p className={`sync sync-${sync}`} role="status" aria-live="polite">{SYNC_LABELS[sync]}</p>
      </div>

      <header className="note-head">
        <p className="fam-tag">{philosophy.name}</p>
        <div className="row">
          <h2>{own && <span className="star" aria-hidden="true">★ </span>}{topic.name}</h2>
          <button
            type="button" className={`icon-btn${note.favorite ? ' on' : ''}`} aria-pressed={note.favorite}
            aria-label={note.favorite ? 'Retirer cette note des favoris' : 'Mettre cette note en favori'}
            onClick={() => set({ favorite: !note.favorite })}
          >{note.favorite ? '★' : '☆'}</button>
        </div>
        {own
          ? <p className="own-tag"><span aria-hidden="true">★</span> {ownLabel(philosophy.name)}</p>
          : <p className="theme-tag">Thème : {theme?.name}</p>}
        <p className="question">{question}</p>
        {note.status === 'deep' && (
          <p className="notice" role="status">Tu as déjà approfondi cette case. Tu peux la relire ou la reprendre.</p>
        )}
        <fieldset className="statuses">
          <legend>État de la note</legend>
          {(['empty', 'draft', 'deep'] as NoteStatus[]).map((s) => (
            <label key={s} className={`seg${note.status === s ? ' on' : ''}`}>
              <input type="radio" name="status" checked={note.status === s} onChange={() => set({ status: s })} />
              {STATUS_LABELS[s]}
            </label>
          ))}
        </fieldset>
      </header>

      <MdField id="research" label="Recherche" hint="Ce que je découvre, en Markdown : # titres, listes, **gras**, liens, tableaux…" value={note.research} onChange={(research) => set({ research, status: note.status === 'empty' && research.trim() ? 'draft' : note.status })} />
      <SourcesEditor sources={note.sources} onChange={(sources) => set({ sources })} />
      <MdField id="reaction" label="Ma réaction personnelle" hint="Est-ce que cela résonne avec moi ? Pourquoi ?" value={note.reaction} onChange={(reaction) => set({ reaction })} />

      <section>
        <h3>Étiquettes</h3>
        <TagsEditor tags={note.tags} onChange={(tags) => set({ tags })} />
      </section>
    </main>
  )
}
