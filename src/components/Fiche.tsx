import { ArrowLeft } from 'lucide-react'
import MdField from './MdField'
import PhilosophyCard from './PhilosophyCard'
import { HandCheck, HandStar } from './HandMarks'
import { useData } from '../lib/DataContext'
import { topicsFor } from '../lib/draw'
import { shouldSuggestSynthesis, synthesisQuestion, themeTopics } from '../lib/tools'
import { href } from '../lib/route'
import { cellKey, emptySynthesis, type NoteStatus, type Philosophy, type Synthesis, type Topic } from '../lib/types'
import { ownLabel } from '../lib/ui'

interface Props {
  philosophy: Philosophy
  number: number
  total: number
  topics: Topic[]
  statuses: Record<string, NoteStatus>
  syntheses: Record<string, Synthesis>
  onPatch: (patch: Partial<Philosophy>) => void
  onSynthesis: (s: Synthesis) => void
}

const LABEL: Record<NoteStatus, string> = { empty: 'vide', draft: 'brouillon', deep: 'approfondi' }

function TopicLink({ philosophyId, t, status }: { philosophyId: string; t: Topic; status: NoteStatus }) {
  return (
    <li>
      <a className={`topic-link${t.scope === 'own' ? ' own' : ''}`} href={href(['note', philosophyId, t.id])}>
        <HandCheck status={status} />
        <span className="topic-name">{t.scope === 'own' && <HandStar size={16} />}{t.name}</span>
        <span className="topic-state">{LABEL[status]}</span>
      </a>
    </li>
  )
}

export default function Fiche({ philosophy: p, number, total, topics, statuses, syntheses, onPatch, onSynthesis }: Props) {
  const { themes } = useData()
  const all = topicsFor(p.id, topics)
  const deep = all.filter((t) => statuses[cellKey(p.id, t.id)] === 'deep').length
  const own = all.filter((t) => t.scope === 'own')

  return (
    <main className="screen fiche notebook" id="main">
      <div className="sheet">
        <a className="btn btn-ghost btn-sm back" href={href(['carnet'])}><ArrowLeft size={16} aria-hidden="true" />Carnet</a>
        <div className="fiche-grid">
          <PhilosophyCard variant="plain" philosophy={p} number={number} total={total} progress={{ deep, total: all.length }} onPatch={onPatch} />

          <div className="fiche-body">
            {themes.map((theme) => {
              const list = themeTopics(theme.id, topics)
              if (!list.length) return null
              const s = syntheses[`${p.id}|${theme.id}`] ?? emptySynthesis(p.id, theme.id)
              const suggest = shouldSuggestSynthesis(p.id, theme, topics, statuses, syntheses)
              return (
                <section key={theme.id} className="theme-block" aria-labelledby={`th-${theme.id}`}>
                  <h2 id={`th-${theme.id}`}>{theme.name}</h2>
                  <ul className="topic-list">
                    {list.map((t) => <TopicLink key={t.id} philosophyId={p.id} t={t} status={statuses[cellKey(p.id, t.id)] ?? 'empty'} />)}
                  </ul>
                  {suggest && (
                    <p className="notice" role="status">Tous les sujets de ce thème sont au moins en brouillon : c’est le bon moment pour écrire ta synthèse.</p>
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
                <h2 id="own-h"><HandStar size={20} />{ownLabel(p.name)}</h2>
                <ul className="topic-list">
                  {own.map((t) => <TopicLink key={t.id} philosophyId={p.id} t={t} status={statuses[cellKey(p.id, t.id)] ?? 'empty'} />)}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
