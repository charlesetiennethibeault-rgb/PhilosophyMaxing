import Fiche from './Fiche'
import HistoryList from './HistoryList'
import Manage from './Manage'
import NotesList from './NotesList'
import PhilosophyList from './PhilosophyList'
import { href } from '../lib/route'
import type { AppState } from '../lib/appState'

export type CarnetSub = 'philosophies' | 'notes' | 'historique' | 'gerer'
const SUBS: { id: CarnetSub; label: string; path: string[] }[] = [
  { id: 'philosophies', label: 'Philosophies', path: ['carnet'] },
  { id: 'notes', label: 'Mes notes', path: ['carnet', 'notes'] },
  { id: 'historique', label: 'Historique', path: ['carnet', 'historique'] },
  { id: 'gerer', label: 'Gérer', path: ['carnet', 'gerer'] },
]

interface Props {
  st: AppState
  sub: CarnetSub
  section?: string
  ficheId: string | null
  query: string
  onQuery: (q: string) => void
  email: string
  onSignOut: () => void
}

export default function Carnet({ st, sub, section, ficheId, query, onQuery, email, onSignOut }: Props) {
  const fiche = ficheId ? st.philosophies.find((p) => p.id === ficheId) : null
  if (ficheId) {
    if (!fiche) {
      return (
        <main className="screen notebook" id="main">
          <div className="sheet">
            <div className="empty">
              <h1 className="hand-title">Cette philosophie n’existe plus</h1>
              <p>Elle a peut-être été supprimée depuis Gérer.</p>
              <a className="btn btn-secondary" href={href(['carnet'])}>Retour au carnet</a>
            </div>
          </div>
        </main>
      )
    }
    const sorted = [...st.philosophies].sort((a, b) => a.order - b.order)
    return (
      <Fiche
        philosophy={fiche} number={sorted.findIndex((p) => p.id === fiche.id) + 1} total={sorted.length}
        topics={st.topics} statuses={st.statuses} syntheses={st.syntheses}
        sync={st.sync} schemaReady={st.schemaReady}
        onPatch={(patch) => st.patchPhilosophy(fiche.id, patch)}
        onWrite={(patch) => st.patchPhilosophy(fiche.id, patch, 800)}
        onSynthesis={st.saveSynthesis}
      />
    )
  }
  return (
    <main className="screen carnet notebook" id="main">
      <div className="sheet">
        <h1 className="hand-title">Carnet</h1>
        <nav className="tabs" aria-label="Sections du carnet">
          {SUBS.map((s) => (
            <a key={s.id} href={href(s.path)} aria-current={sub === s.id ? 'page' : undefined}>{s.label}</a>
          ))}
        </nav>
        {sub === 'philosophies' && (
          <PhilosophyList philosophies={st.philosophies} topics={st.topics} notes={st.notes} statuses={st.statuses} query={query} onQuery={onQuery} />
        )}
        {sub === 'notes' && <NotesList notes={st.notes} philosophies={st.philosophies} topics={st.topics} />}
        {sub === 'historique' && <HistoryList history={st.history} philosophies={st.philosophies} topics={st.topics} />}
        {sub === 'gerer' && <Manage st={st} email={email} onSignOut={onSignOut} section={section} />}
      </div>
    </main>
  )
}
