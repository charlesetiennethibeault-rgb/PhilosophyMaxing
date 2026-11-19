import { useMemo, useState } from 'react'
import FiltersPanel from './FiltersPanel'
import { useData } from '../lib/DataContext'
import { emptyFilters, matchesFilters, progressOf } from '../lib/draw'
import { searchPhilosophies } from '../lib/tools'
import { glyphFor } from '../lib/ui'
import type { Note, NoteStatus, Philosophy, Topic } from '../lib/types'

interface Props {
  philosophies: Philosophy[]
  topics: Topic[]
  notes: Record<string, Note>
  statuses: Record<string, NoteStatus>
  onOpen: (id: string) => void
  onOpenNote: (philosophyId: string, topicId: string) => void
}

export default function PhilosophyList({ philosophies, topics, notes, statuses, onOpen, onOpenNote }: Props) {
  const { family, familyIdx } = useData()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(emptyFilters)

  const filtered = useMemo(() => philosophies.filter((p) => matchesFilters(p, filters)), [philosophies, filters])
  const hits = useMemo(() => searchPhilosophies(query, filtered, Object.values(notes)), [query, filtered, notes])
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? id

  return (
    <div className="plist">
      <div className="plist-search">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input
          id="q" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un nom, un acteur, un mot de mes notes…"
        />
        <p className="count" aria-live="polite">{hits.length} résultat{hits.length > 1 ? 's' : ''} sur {philosophies.length}</p>
      </div>

      <details className="plist-filters">
        <summary>Filtres</summary>
        <FiltersPanel filters={filters} onFilters={setFilters} wheelCount={filtered.length} />
      </details>

      <ul className="plist-items">
        {hits.map(({ philosophy: p, notes: matched, matchedIn }) => {
          const fam = family(p.family)
          const prog = progressOf(p.id, topics, statuses)
          return (
            <li key={p.id} style={{ ['--fam' as string]: fam.color }}>
              <button type="button" className="plist-item" onClick={() => onOpen(p.id)}>
                <span className="swatch" style={{ background: fam.color }} aria-hidden="true">{glyphFor(familyIdx(p.family))}</span>
                <span className="plist-main">
                  <strong>{p.name}</strong>
                  <span className="plist-sub">{fam.name} · {p.dateLabel}</span>
                  {query && matchedIn.length > 0 && <span className="plist-sub">Trouvé dans : {matchedIn.join(', ')}</span>}
                </span>
                <span className="plist-side">
                  {p.favorite && <span className="chip" title="Favori">★</span>}
                  {p.reserve && <span className="chip">en réserve</span>}
                  {p.aVerifier && <span className="chip warn">à vérifier</span>}
                  <span className="plist-prog">{prog.deep}/{prog.total}</span>
                </span>
              </button>
              {matched.length > 0 && (
                <ul className="plist-notes">
                  {matched.map((n) => (
                    <li key={n.topic}>
                      <button type="button" className="link" onClick={() => onOpenNote(n.philosophy, n.topic)}>Note : {topicName(n.topic)}</button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
        {hits.length === 0 && <li className="md-empty">Aucune philosophie ne correspond.</li>}
      </ul>
    </div>
  )
}
