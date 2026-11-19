import { useMemo, useState } from 'react'
import { Check, Search, Star } from 'lucide-react'
import FamilyMark from './FamilyMark'
import FiltersPanel from './FiltersPanel'
import { useData } from '../lib/DataContext'
import { emptyFilters, matchesFilters, progressOf } from '../lib/draw'
import { href } from '../lib/route'
import { searchPhilosophies } from '../lib/tools'
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

export default function PhilosophyList({ philosophies, topics, notes, statuses, query, onQuery }: Props) {
  const { family, familyIdx } = useData()
  const [filters, setFilters] = useState(emptyFilters)

  const numbers = useMemo(() => new Map([...philosophies].sort((a, b) => a.order - b.order).map((p, i) => [p.id, i + 1])), [philosophies])
  const filtered = useMemo(() => philosophies.filter((p) => matchesFilters(p, filters)), [philosophies, filters])
  const hits = useMemo(() => searchPhilosophies(query, filtered, Object.values(notes)), [query, filtered, notes])
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? id
  const filtering = !!query || JSON.stringify(filters) !== JSON.stringify(emptyFilters)

  return (
    <div className="plist">
      <div className="search">
        <Search size={20} aria-hidden="true" />
        <label htmlFor="q" className="sr-only">Rechercher dans le carnet</label>
        <input
          id="q" type="search" value={query} onChange={(e) => onQuery(e.target.value)} autoComplete="off" spellCheck={false}
          placeholder="Un nom, un acteur, un mot…"
        />
      </div>
      <p className="meta" aria-live="polite">{hits.length}&nbsp;résultat{hits.length > 1 ? 's' : ''} sur&nbsp;{philosophies.length}</p>

      <details className="plist-filters">
        <summary>Filtrer</summary>
        <FiltersPanel filters={filters} onFilters={setFilters} wheelCount={filtered.length} />
      </details>

      <ul className="rows">
        {hits.map(({ philosophy: p, notes: matched, matchedIn }) => {
          const fam = family(p.family)
          const prog = progressOf(p.id, topics, statuses)
          return (
            <li key={p.id}>
              <a className="row-link" href={href(['carnet', 'fiche', p.id])}>
                <span className="catalog">{catalogNumber(numbers.get(p.id) ?? 0, philosophies.length).split(' /')[0]}</span>
                <span className="row-main">
                  <strong>{p.name}</strong>
                  <span className="meta"><FamilyMark index={familyIdx(p.family)} color={fam.color} size={12} />{fam.name} · {p.dateLabel}</span>
                  {query && matchedIn.length > 0 && <span className="meta">Trouvé dans : {matchedIn.join(', ')}</span>}
                </span>
                <span className="row-side">
                  {p.favorite && <Star size={16} aria-label="Favori" fill="currentColor" />}
                  {p.reserve && <span className="tag">En réserve</span>}
                  {!p.aVerifier && <span className="meta ok"><Check size={16} aria-hidden="true" />Vérifiée</span>}
                  <span className="prog">{prog.deep}/{prog.total}</span>
                </span>
              </a>
              {matched.length > 0 && (
                <ul className="row-notes">
                  {matched.map((n) => (
                    <li key={n.topic}><a href={href(['note', n.philosophy, n.topic])}>Note : {topicName(n.topic)}</a></li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {hits.length === 0 && (
        <div className="empty">
          <h2>{filtering ? 'Aucune philosophie ne correspond' : 'Le carnet est vide'}</h2>
          <p>{filtering ? 'Essaie un autre mot, ou retire des filtres pour élargir la recherche.' : 'Aucune philosophie à afficher.'}</p>
          {filtering && <button type="button" className="btn btn-secondary" onClick={() => { onQuery(''); setFilters(emptyFilters) }}>Effacer la recherche et les filtres</button>}
        </div>
      )}
    </div>
  )
}
