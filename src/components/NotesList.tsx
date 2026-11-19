import { useMemo, useState } from 'react'
import { normalize } from '../lib/tools'
import type { Note, NoteStatus, Philosophy, Topic } from '../lib/types'

interface Props {
  notes: Record<string, Note>
  philosophies: Philosophy[]
  topics: Topic[]
  onOpenNote: (philosophyId: string, topicId: string) => void
}

const LABEL: Record<NoteStatus, string> = { empty: 'vide', draft: 'brouillon', deep: 'approfondi' }

export default function NotesList({ notes, philosophies, topics, onOpenNote }: Props) {
  const [status, setStatus] = useState<'all' | NoteStatus>('all')
  const [favOnly, setFavOnly] = useState(false)
  const [tag, setTag] = useState('')

  const rows = useMemo(() => Object.values(notes)
    .filter((n) => n.status !== 'empty' || n.research.trim() || n.reaction.trim() || n.favorite || n.tags.length)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [notes])
  const allTags = useMemo(() => [...new Set(rows.flatMap((n) => n.tags))].sort((a, b) => normalize(a).localeCompare(normalize(b))), [rows])
  const shown = rows.filter((n) => (status === 'all' || n.status === status) && (!favOnly || n.favorite) && (!tag || n.tags.includes(tag)))

  const pName = (id: string) => philosophies.find((p) => p.id === id)?.name ?? id
  const tName = (id: string) => topics.find((t) => t.id === id)?.name ?? id
  const excerpt = (n: Note) => n.research.replace(/[#*_>`|\-[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)

  return (
    <div className="nlist">
      <div className="nlist-filters">
        <label>État
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">Tous</option><option value="draft">Brouillon</option><option value="deep">Approfondi</option><option value="empty">Vide</option>
          </select>
        </label>
        <label>Étiquette
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">Toutes</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} /><span>Favoris seulement</span></label>
      </div>
      <p className="count" aria-live="polite">{shown.length} note{shown.length > 1 ? 's' : ''}</p>
      <ul className="nlist-items">
        {shown.map((n) => (
          <li key={`${n.philosophy}|${n.topic}`}>
            <button type="button" className="nlist-item" onClick={() => onOpenNote(n.philosophy, n.topic)}>
              <span className="nlist-title">{n.favorite && <span className="chip">★</span>} {pName(n.philosophy)} <span className="sep">·</span> {tName(n.topic)}</span>
              <span className="plist-sub">{LABEL[n.status]}{n.tags.length > 0 && ` · ${n.tags.join(', ')}`}</span>
              {excerpt(n) && <span className="excerpt">{excerpt(n)}</span>}
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="md-empty">Aucune note ne correspond. Tourne la roue ou ouvre une fiche pour en commencer une.</li>}
      </ul>
    </div>
  )
}
