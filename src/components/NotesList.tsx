import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { useLang } from '../i18n'
import { href } from '../lib/route'
import { normalize } from '../lib/tools'
import type { Note, NoteStatus, Philosophy, Topic } from '../lib/types'

interface Props {
  notes: Record<string, Note>
  philosophies: Philosophy[]
  topics: Topic[]
}

export default function NotesList({ notes, philosophies, topics }: Props) {
  const { t } = useLang()
  const [status, setStatus] = useState<'all' | NoteStatus>('all')
  const [favOnly, setFavOnly] = useState(false)
  const [tag, setTag] = useState('')

  const rows = useMemo(() => Object.values(notes)
    .filter((n) => n.status !== 'empty' || n.research.trim() || n.reaction.trim() || n.favorite || n.tags.length)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [notes])
  const allTags = useMemo(() => [...new Set(rows.flatMap((n) => n.tags))].sort((a, b) => normalize(a).localeCompare(normalize(b))), [rows])
  const shown = rows.filter((n) => (status === 'all' || n.status === status) && (!favOnly || n.favorite) && (!tag || n.tags.includes(tag)))

  const pName = (id: string) => philosophies.find((p) => p.id === id)?.name ?? id
  const tName = (id: string) => topics.find((x) => x.id === id)?.name ?? id
  const excerpt = (n: Note) => n.research.replace(/[#*_>`|\-[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)

  if (rows.length === 0) {
    return (
      <div className="empty">
        <h2>{t('nlist.emptyTitle')}</h2>
        <p>{t('nlist.emptyText')}</p>
        <a className="btn btn-primary" href={href(['roue'])}>{t('common.goToWheel')}</a>
      </div>
    )
  }

  return (
    <div className="nlist">
      <div className="toolbar">
        <label>{t('nlist.status')}
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">{t('common.all')}</option><option value="draft">{t('statusCap.draft')}</option><option value="deep">{t('statusCap.deep')}</option><option value="empty">{t('statusCap.empty')}</option>
          </select>
        </label>
        <label>{t('nlist.tag')}
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">{t('common.allF')}</option>
            {allTags.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} /><span>{t('common.favoritesOnly')}</span></label>
      </div>
      <p className="meta" aria-live="polite">{t('nlist.count', { count: shown.length })}</p>
      <ul className="rows">
        {shown.map((n) => (
          <li key={`${n.philosophy}|${n.topic}`}>
            <a className="row-link" href={href(['note', n.philosophy, n.topic])}>
              <span className="row-main">
                <strong>{pName(n.philosophy)} · {tName(n.topic)}</strong>
                <span className="meta">{t(`status.${n.status}`)}{n.tags.length > 0 && ` · ${n.tags.join(', ')}`}</span>
                {excerpt(n) && <span className="excerpt">{excerpt(n)}</span>}
              </span>
              <span className="row-side">{n.favorite && <Star size={16} aria-label={t('common.favorite')} fill="currentColor" />}</span>
            </a>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <div className="empty">
          <h2>{t('nlist.noMatchTitle')}</h2>
          <p>{t('nlist.noMatchText')}</p>
          <button type="button" className="btn btn-secondary" onClick={() => { setStatus('all'); setTag(''); setFavOnly(false) }}>{t('common.clearFilters')}</button>
        </div>
      )}
    </div>
  )
}
