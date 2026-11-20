import { useMemo, useState } from 'react'
import { Check, Search, Star } from 'lucide-react'
import FamilyMark from './FamilyMark'
import FiltersPanel from './FiltersPanel'
import { useData } from '../lib/DataContext'
import { emptyFilters, matchesFilters, progressOf } from '../lib/draw'
import { useLang } from '../i18n'
import { href } from '../lib/route'
import { searchPhilosophies, type SearchHit } from '../lib/tools'
import { catalogNumber } from '../lib/ui'
import type { Note, NoteStatus, Philosophy, Topic } from '../lib/types'

interface Props {
  philosophies: Philosophy[]
  topics: Topic[]
  notes: Record<string, Note>
  statuses: Record<string, NoteStatus>
  query: string
  onQuery: (q: string) => void
}

const FOUND: Record<SearchHit['matchedIn'][number], 'plist.found.nom' | 'plist.found.acteur' | 'plist.found.fiche' | 'plist.found.mes écrits' | 'plist.found.notes'> = {
  nom: 'plist.found.nom', acteur: 'plist.found.acteur', fiche: 'plist.found.fiche', 'mes écrits': 'plist.found.mes écrits', notes: 'plist.found.notes',
}

export default function PhilosophyList({ philosophies, topics, notes, statuses, query, onQuery }: Props) {
  const { t } = useLang()
  const { family, familyIdx } = useData()
  const [filters, setFilters] = useState(emptyFilters)

  const numbers = useMemo(() => new Map([...philosophies].sort((a, b) => a.order - b.order).map((p, i) => [p.id, i + 1])), [philosophies])
  const filtered = useMemo(() => philosophies.filter((p) => matchesFilters(p, filters)), [philosophies, filters])
  const hits = useMemo(() => searchPhilosophies(query, filtered, Object.values(notes)), [query, filtered, notes])
  const topicName = (id: string) => topics.find((x) => x.id === id)?.name ?? id
  const filtering = !!query || JSON.stringify(filters) !== JSON.stringify(emptyFilters)

  return (
    <div className="plist">
      <div className="search">
        <Search size={20} aria-hidden="true" />
        <label htmlFor="q" className="sr-only">{t('plist.searchLabel')}</label>
        <input
          id="q" type="search" value={query} onChange={(e) => onQuery(e.target.value)} autoComplete="off" spellCheck={false}
          placeholder={t('plist.searchPlaceholder')}
        />
      </div>
      <p className="meta" aria-live="polite">{t('plist.results', { count: hits.length, total: philosophies.length })}</p>

      <details className="plist-filters">
        <summary>{t('plist.filter')}</summary>
        <FiltersPanel filters={filters} onFilters={setFilters} wheelCount={filtered.length} />
      </details>

      <ul className="rows">
        {hits.map(({ philosophy: p, notes: matched, matchedIn }) => {
          const fam = family(p.family)
          const prog = progressOf(p.id, topics, statuses)
          return (
            <li key={p.id}>
              <a className="row-link" href={href(['carnet', 'fiche', p.id])}>
                <span className="catalog">{catalogNumber(numbers.get(p.id) ?? 0, philosophies.length).split(' /')[0]}</span>
                <span className="row-main">
                  <strong>{p.name}</strong>
                  <span className="meta"><FamilyMark index={familyIdx(p.family)} color={fam.color} size={12} />{fam.name} · {p.dateLabel}</span>
                  {query && matchedIn.length > 0 && <span className="meta">{t('plist.foundIn', { list: matchedIn.map((m) => t(FOUND[m])).join(', ') })}</span>}
                </span>
                <span className="row-side">
                  {p.favorite && <Star size={16} aria-label={t('common.favorite')} fill="currentColor" />}
                  {p.reserve && <span className="tag">{t('plist.setAside')}</span>}
                  {!p.aVerifier && <span className="meta ok"><Check size={16} aria-hidden="true" />{t('plist.verified')}</span>}
                  <span className="prog">{prog.deep}/{prog.total}</span>
                </span>
              </a>
              {matched.length > 0 && (
                <ul className="row-notes">
                  {matched.map((n) => (
                    <li key={n.topic}><a href={href(['note', n.philosophy, n.topic])}>{t('plist.note', { topic: topicName(n.topic) })}</a></li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {hits.length === 0 && (
        <div className="empty">
          <h2>{filtering ? t('plist.noMatchTitle') : t('plist.emptyTitle')}</h2>
          <p>{filtering ? t('plist.noMatchText') : t('plist.emptyText')}</p>
          {filtering && <button type="button" className="btn btn-secondary" onClick={() => { onQuery(''); setFilters(emptyFilters) }}>{t('plist.clearAll')}</button>}
        </div>
      )}
    </div>
  )
}
