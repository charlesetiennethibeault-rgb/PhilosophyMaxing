import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { href } from '../lib/route'
import { normalize } from '../lib/tools'
import type { Note, NoteStatus, Philosophy, Topic } from '../lib/types'

interface Props {
  notes: Record<string, Note>
  philosophies: Philosophy[]
  topics: Topic[]
}

const LABEL: Record<NoteStatus, string> = { empty: 'vide', draft: 'brouillon', deep: 'approfondi' }

export default function NotesList({ notes, philosophies, topics }: Props) {
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

  if (rows.length === 0) {
    return (
      <div className="empty">
        <h2>Tes notes apparaîtront ici</h2>
        <p>Chaque case (une philosophie et un sujet) a sa propre note. Tire une philosophie à la roue, puis choisis un sujet pour écrire la première.</p>
        <a className="btn btn-primary" href={href(['roue'])}>Aller à la roue</a>
      </div>
    )
  }

  return (
    <div className="nlist">
      <div className="toolbar">
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
      <p className="meta" aria-live="polite">{shown.length}&nbsp;note{shown.length > 1 ? 's' : ''}</p>
      <ul className="rows">
        {shown.map((n) => (
          <li key={`${n.philosophy}|${n.topic}`}>
            <a className="row-link" href={href(['note', n.philosophy, n.topic])}>
              <span className="row-main">
                <strong>{pName(n.philosophy)} · {tName(n.topic)}</strong>
                <span className="meta">{LABEL[n.status]}{n.tags.length > 0 && ` · ${n.tags.join(', ')}`}</span>
                {excerpt(n) && <span className="excerpt">{excerpt(n)}</span>}
              </span>
              <span className="row-side">{n.favorite && <Star size={16} aria-label="Favori" fill="currentColor" />}</span>
            </a>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <div className="empty">
          <h2>Aucune note ne correspond</h2>
          <p>Aucune note n’a cet état, cette étiquette ou ce statut de favori.</p>
          <button type="button" className="btn btn-secondary" onClick={() => { setStatus('all'); setTag(''); setFavOnly(false) }}>Effacer les filtres</button>
        </div>
      )}
    </div>
  )
}
