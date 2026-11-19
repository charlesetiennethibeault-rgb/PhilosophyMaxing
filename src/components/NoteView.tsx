import { useState } from 'react'
import { ArrowLeft, Check, CircleAlert, CircleCheck, CircleDashed, Contrast, ExternalLink, Plus, Star, Trash2, X } from 'lucide-react'
import MdField from './MdField'
import { useData } from '../lib/DataContext'
import { frQuestion, ownLabel } from '../lib/ui'
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

const STATUS: Record<NoteStatus, { label: string; Icon: typeof Contrast }> = {
  empty: { label: 'Vide', Icon: CircleDashed },
  draft: { label: 'Brouillon', Icon: Contrast },
  deep: { label: 'Approfondi', Icon: CircleCheck },
}
const SOURCE_TYPES: { id: SourceType; label: string }[] = [
  { id: 'livre', label: 'Livre' }, { id: 'article', label: 'Article' }, { id: 'video', label: 'Vidéo' },
]

function SyncLine({ sync }: { sync: SyncStatus }) {
  if (sync === 'saved') return <p className="sync ok" role="status"><Check size={16} aria-hidden="true" />Enregistré</p>
  if (sync === 'pending') return <p className="sync" role="status">Enregistrement…</p>
  return <p className="sync warn" role="status"><CircleAlert size={16} aria-hidden="true" />Hors ligne : ton texte est gardé sur cet appareil et sera renvoyé</p>
}

function SourcesEditor({ sources, onChange }: { sources: Source[]; onChange: (s: Source[]) => void }) {
  const set = (i: number, patch: Partial<Source>) => onChange(sources.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const isUrl = (u: string) => /^https?:\/\//i.test(u)
  return (
    <section className="sources">
      <h3>Sources et liens</h3>
      {sources.length === 0 && <p className="empty-inline">Aucune source. Ajoute le livre, l’article ou la vidéo qui nourrit cette note.</p>}
      <ul>
        {sources.map((s, i) => (
          <li key={i}>
            <input aria-label={`Titre de la source ${i + 1}`} placeholder="Titre" value={s.title} onChange={(e) => set(i, { title: e.target.value })} />
            <input aria-label={`Adresse de la source ${i + 1}`} placeholder="https://…" type="url" inputMode="url" autoComplete="off" spellCheck={false} value={s.url} onChange={(e) => set(i, { url: e.target.value.trim() })} />
            <select aria-label={`Type de la source ${i + 1}`} value={s.type} onChange={(e) => set(i, { type: e.target.value as SourceType })}>
              {SOURCE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <span className="source-actions">
              {isUrl(s.url) && <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Ouvrir<ExternalLink size={16} aria-hidden="true" /></a>}
              <button type="button" className="icon-btn" aria-label={`Supprimer la source ${i + 1}`} onClick={() => onChange(sources.filter((_, j) => j !== i))}><Trash2 size={20} aria-hidden="true" /></button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...sources, { title: '', url: '', type: 'livre' }])}>
        <Plus size={16} aria-hidden="true" />Ajouter une source
      </button>
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
        <span key={t} className="tag">{t}<button type="button" aria-label={`Retirer l’étiquette ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}><X size={16} aria-hidden="true" /></button></span>
      ))}
      <input
        aria-label="Ajouter une étiquette" placeholder="Nouvelle étiquette" value={draft} autoComplete="off"
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
  const question = frQuestion(topic.question, philosophy.name)
  const set = (patch: Partial<Note>) => onChange({ ...note, ...patch })

  return (
    <main className="screen noteview notebook" id="main">
      <div className="sheet">
      <div className="note-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Retour</button>
        <SyncLine sync={sync} />
      </div>

      <header className="note-head">
        <p className="meta">{philosophy.name}{theme && <> · {theme.name}</>}</p>
        <div className="row">
          <h1>{topic.name}</h1>
          <button
            type="button" className="icon-btn" aria-pressed={note.favorite}
            aria-label={note.favorite ? 'Retirer cette note des favoris' : 'Mettre cette note en favori'}
            onClick={() => set({ favorite: !note.favorite })}
          ><Star size={20} aria-hidden="true" fill={note.favorite ? 'currentColor' : 'none'} /></button>
        </div>
        {own && <p className="own-tag"><Star size={16} aria-hidden="true" fill="currentColor" />{ownLabel(philosophy.name)}</p>}
        <p className="question">{question}</p>
        {note.status === 'deep' && <p className="notice" role="status"><CircleCheck size={16} aria-hidden="true" />Tu as déjà approfondi cette case. Tu peux la relire ou la reprendre.</p>}

        <fieldset className="seg-fieldset">
          <legend>État de la note</legend>
          <div className="seg-group">
            {(['empty', 'draft', 'deep'] as NoteStatus[]).map((s) => {
              const { label, Icon } = STATUS[s]
              return (
                <label key={s} className={`seg${note.status === s ? ' on' : ''}`}>
                  <input type="radio" name="status" checked={note.status === s} onChange={() => set({ status: s })} />
                  <Icon size={16} aria-hidden="true" />{label}
                </label>
              )
            })}
          </div>
        </fieldset>
      </header>

      <MdField id="research" label="Recherche" hint="Ce que je découvre, en Markdown : titres, listes, **gras**, liens, tableaux…" value={note.research} onChange={(research) => set({ research, status: note.status === 'empty' && research.trim() ? 'draft' : note.status })} />
      <SourcesEditor sources={note.sources} onChange={(sources) => set({ sources })} />
      <MdField id="reaction" label="Ma réaction personnelle" hint="Est-ce que cela résonne avec moi ? Pourquoi ?" value={note.reaction} onChange={(reaction) => set({ reaction })} />

      <section>
        <h3>Étiquettes</h3>
        <TagsEditor tags={note.tags} onChange={(tags) => set({ tags })} />
      </section>
      </div>
    </main>
  )
}
