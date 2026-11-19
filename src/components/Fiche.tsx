import MdField from './MdField'
import PhilosophyCard from './PhilosophyCard'
import { useData } from '../lib/DataContext'
import { topicsFor } from '../lib/draw'
import { shouldSuggestSynthesis, synthesisQuestion, themeTopics } from '../lib/tools'
import { cellKey, emptySynthesis, type NoteStatus, type Philosophy, type Synthesis, type Topic } from '../lib/types'
import { ownLabel } from '../lib/ui'

interface Props {
  philosophy: Philosophy
  topics: Topic[]
  statuses: Record<string, NoteStatus>
  syntheses: Record<string, Synthesis>
  onPatch: (patch: Partial<Philosophy>) => void
  onSynthesis: (s: Synthesis) => void
  onOpenNote: (topicId: string) => void
  onBack: () => void
}

const PILL: Record<NoteStatus, { icon: string; label: string }> = {
  empty: { icon: '○', label: 'vide' },
  draft: { icon: '◐', label: 'brouillon' },
  deep: { icon: '✓', label: 'approfondi' },
}

function TopicLink({ t, status, onOpen }: { t: Topic; status: NoteStatus; onOpen: () => void }) {
  const pill = PILL[status]
  return (
    <li>
      <button type="button" className={`topic-link${t.scope === 'own' ? ' own' : ''}`} onClick={onOpen}>
        <span className={`dot dot-${status}`} aria-hidden="true">{pill.icon}</span>
        <span className="topic-name">{t.scope === 'own' && <span aria-hidden="true">★ </span>}{t.name}</span>
        <span className="topic-state">{pill.label}</span>
      </button>
    </li>
  )
}

export default function Fiche({ philosophy: p, topics, statuses, syntheses, onPatch, onSynthesis, onOpenNote, onBack }: Props) {
  const { themes } = useData()
  const all = topicsFor(p.id, topics)
  const deep = all.filter((t) => statuses[cellKey(p.id, t.id)] === 'deep').length
  const own = all.filter((t) => t.scope === 'own')

  return (
    <main className="fiche">
      <button type="button" className="btn small" onClick={onBack}>← Retour au carnet</button>
      <div className="fiche-grid">
        <PhilosophyCard philosophy={p} progress={{ deep, total: all.length }} onPatch={onPatch} />

        <div className="fiche-body">
          {themes.map((theme) => {
            const list = themeTopics(theme.id, topics)
            if (!list.length) return null
            const key = `${p.id}|${theme.id}`
            const s = syntheses[key] ?? emptySynthesis(p.id, theme.id)
            const suggest = shouldSuggestSynthesis(p.id, theme, topics, statuses, syntheses)
            return (
              <section key={theme.id} className="theme-block" aria-labelledby={`th-${theme.id}`}>
                <h3 id={`th-${theme.id}`}>{theme.name}</h3>
                <ul className="topic-list">
                  {list.map((t) => <TopicLink key={t.id} t={t} status={statuses[cellKey(p.id, t.id)] ?? 'empty'} onOpen={() => onOpenNote(t.id)} />)}
                </ul>
                {suggest && (
                  <p className="notice suggest" role="status">
                    Tous les sujets de ce thème sont au moins en brouillon : c’est le bon moment d’écrire ta synthèse.
                  </p>
                )}
                <MdField
                  id={`synth-${theme.id}`}
                  label="Synthèse du thème"
                  hint={synthesisQuestion(p.name, theme.name)}
                  value={s.body}
                  onChange={(body) => onSynthesis({ ...s, body, status: body.trim() ? (s.status === 'deep' ? 'deep' : 'draft') : 'empty' })}
                />
              </section>
            )
          })}

          {own.length > 0 && (
            <section className="theme-block own-block" aria-labelledby="own-h">
              <h3 id="own-h"><span aria-hidden="true">★ </span>{ownLabel(p.name)}</h3>
              <ul className="topic-list">
                {own.map((t) => <TopicLink key={t.id} t={t} status={statuses[cellKey(p.id, t.id)] ?? 'empty'} onOpen={() => onOpenNote(t.id)} />)}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
