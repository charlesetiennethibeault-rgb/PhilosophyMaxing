import Fiche from './Fiche'
import HistoryList from './HistoryList'
import Manage from './Manage'
import NotesList from './NotesList'
import PhilosophyList from './PhilosophyList'
import { useLang, type MsgKey } from '../i18n'
import { href } from '../lib/route'
import type { AppState } from '../lib/appState'

export type CarnetSub = 'philosophies' | 'notes' | 'historique' | 'gerer'
const SUBS: { id: CarnetSub; label: MsgKey; path: string[] }[] = [
  { id: 'philosophies', label: 'carnet.philosophies', path: ['carnet'] },
  { id: 'notes', label: 'carnet.notes', path: ['carnet', 'notes'] },
  { id: 'historique', label: 'carnet.history', path: ['carnet', 'historique'] },
  { id: 'gerer', label: 'carnet.manage', path: ['carnet', 'gerer'] },
]

interface Props {
  /** État pour l'affichage : textes traduits selon la langue. */
  st: AppState
  /** État tel qu'enregistré : seul « Gérer » s'en sert, pour ne jamais réécrire une traduction dans les données. */
  raw: AppState
  sub: CarnetSub
  section?: string
  ficheId: string | null
  query: string
  onQuery: (q: string) => void
  email: string
  onSignOut: () => void
}

export default function Carnet({ st, raw, sub, section, ficheId, query, onQuery, email, onSignOut }: Props) {
  const { t } = useLang()
  const fiche = ficheId ? st.philosophies.find((p) => p.id === ficheId) : null
  if (ficheId) {
    if (!fiche) {
      return (
        <main className="screen notebook" id="main">
          <div className="sheet">
            <div className="empty">
              <h1 className="hand-title">{t('entry.notFoundTitle')}</h1>
              <p>{t('entry.notFoundText')}</p>
              <a className="btn btn-secondary" href={href(['carnet'])}>{t('entry.backToNotebook')}</a>
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
        <h1 className="hand-title">{t('nav.carnet')}</h1>
        <nav className="tabs" aria-label={t('carnet.tabs')}>
          {SUBS.map((s) => (
            <a key={s.id} href={href(s.path)} aria-current={sub === s.id ? 'page' : undefined}>{t(s.label)}</a>
          ))}
        </nav>
        {sub === 'philosophies' && (
          <PhilosophyList philosophies={st.philosophies} topics={st.topics} notes={st.notes} statuses={st.statuses} query={query} onQuery={onQuery} />
        )}
        {sub === 'notes' && <NotesList notes={st.notes} philosophies={st.philosophies} topics={st.topics} />}
        {sub === 'historique' && <HistoryList history={st.history} philosophies={st.philosophies} topics={st.topics} />}
        {sub === 'gerer' && <Manage st={raw} view={st} email={email} onSignOut={onSignOut} section={section} />}
      </div>
    </main>
  )
}
