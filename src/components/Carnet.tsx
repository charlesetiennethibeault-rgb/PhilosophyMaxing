import Fiche from './Fiche'
import HistoryList from './HistoryList'
import Manage from './Manage'
import NotesList from './NotesList'
import PhilosophyList from './PhilosophyList'
import type { AppState } from '../lib/appState'

export type CarnetSub = 'philosophies' | 'notes' | 'historique' | 'gerer'
const SUBS: { id: CarnetSub; label: string }[] = [
  { id: 'philosophies', label: 'Philosophies' },
  { id: 'notes', label: 'Mes notes' },
  { id: 'historique', label: 'Historique' },
  { id: 'gerer', label: 'Gérer' },
]

interface Props {
  st: AppState
  sub: CarnetSub
  onSub: (s: CarnetSub) => void
  ficheId: string | null
  onFiche: (id: string | null) => void
  onOpenNote: (philosophyId: string, topicId: string) => void
}

export default function Carnet({ st, sub, onSub, ficheId, onFiche, onOpenNote }: Props) {
  const fiche = ficheId ? st.philosophies.find((p) => p.id === ficheId) : null
  if (fiche) {
    return (
      <Fiche
        philosophy={fiche} topics={st.topics} statuses={st.statuses} syntheses={st.syntheses}
        onPatch={(patch) => st.patchPhilosophy(fiche.id, patch)}
        onSynthesis={st.saveSynthesis}
        onOpenNote={(t) => onOpenNote(fiche.id, t)}
        onBack={() => onFiche(null)}
      />
    )
  }
  return (
    <main className="carnet">
      <h2>Carnet</h2>
      <div className="tabs carnet-tabs" role="tablist" aria-label="Sections du carnet">
        {SUBS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={sub === s.id} className={sub === s.id ? 'on' : ''} onClick={() => onSub(s.id)}>{s.label}</button>
        ))}
      </div>
      {sub === 'philosophies' && (
        <PhilosophyList philosophies={st.philosophies} topics={st.topics} notes={st.notes} statuses={st.statuses} onOpen={onFiche} onOpenNote={onOpenNote} />
      )}
      {sub === 'notes' && <NotesList notes={st.notes} philosophies={st.philosophies} topics={st.topics} onOpenNote={onOpenNote} />}
      {sub === 'historique' && (
        <HistoryList history={st.history} philosophies={st.philosophies} topics={st.topics} onOpenFiche={onFiche} onOpenNote={onOpenNote} />
      )}
      {sub === 'gerer' && <Manage st={st} />}
    </main>
  )
}
