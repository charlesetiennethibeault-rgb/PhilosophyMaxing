import { ArrowLeft } from 'lucide-react'
import MdField from './MdField'
import PhilosophyCard from './PhilosophyCard'
import { HandCheck, HandStar } from './HandMarks'
import SyncLine from './SyncLine'
import type { SyncStatus } from '../lib/sync'
import { useData } from '../lib/DataContext'
import { topicsFor } from '../lib/draw'
import { useLang } from '../i18n'
import { shouldSuggestSynthesis, synthesisQuestion, themeTopics } from '../lib/tools'
import { href } from '../lib/route'
import { cellKey, emptySynthesis, type NoteStatus, type Philosophy, type Synthesis, type Topic } from '../lib/types'
import { ownLabel, withArticle } from '../lib/ui'

interface Props {
  philosophy: Philosophy
  number: number
  total: number
  topics: Topic[]
  statuses: Record<string, NoteStatus>
  syntheses: Record<string, Synthesis>
  sync: SyncStatus
  /** Faux tant que la migration SQL des textes personnels n'est pas appliquée. */
  schemaReady: boolean
  onPatch: (patch: Partial<Philosophy>) => void
  /** Frappe dans l'un des trois textes personnels (envoi différé). */
  onWrite: (patch: Partial<Pick<Philosophy, 'synthesis' | 'opinion' | 'context'>>) => void
  onSynthesis: (s: Synthesis) => void
}

function TopicLink({ philosophyId, t: topic, status }: { philosophyId: string; t: Topic; status: NoteStatus }) {
  const { t } = useLang()
  return (
    <li>
      <a className={`topic-link${topic.scope === 'own' ? ' own' : ''}`} href={href(['note', philosophyId, topic.id])}>
        <HandCheck status={status} />
        <span className="topic-name">{topic.scope === 'own' && <HandStar size={16} />}{topic.name}</span>
        <span className="topic-state">{t(`status.${status}`)}</span>
      </a>
    </li>
  )
}

export default function Fiche({ philosophy: p, number, total, topics, statuses, syntheses, sync, schemaReady, onPatch, onWrite, onSynthesis }: Props) {
  const { t, tRich } = useLang()
  const { themes } = useData()
  const all = topicsFor(p.id, topics)
  const deep = all.filter((x) => statuses[cellKey(p.id, x.id)] === 'deep').length
  const own = all.filter((x) => x.scope === 'own')

  return (
    <main className="screen fiche notebook" id="main">
      <div className="sheet">
        <a className="btn btn-ghost btn-sm back" href={href(['carnet'])}><ArrowLeft size={16} aria-hidden="true" />{t('entry.back')}</a>
        <div className="fiche-grid">
          <PhilosophyCard variant="plain" philosophy={p} number={number} total={total} progress={{ deep, total: all.length }} onPatch={onPatch} />

          <div className="fiche-body">
            <section className="theme-block writings" aria-labelledby="writings-h">
              <div className="writings-head">
                <h2 id="writings-h">{t('entry.writingsOn', { ref: withArticle(p.name, p.ref) })}</h2>
                {schemaReady && <SyncLine sync={sync} />}
              </div>
              {schemaReady ? (
                <>
                  <MdField
                    id="w-synthesis" label={t('entry.synthesis')}
                    hint={t('entry.synthesisHint')}
                    value={p.synthesis} onChange={(synthesis) => onWrite({ synthesis })}
                  />
                  <MdField
                    id="w-opinion" label={t('entry.opinion')}
                    hint={t('entry.opinionHint')}
                    value={p.opinion} onChange={(opinion) => onWrite({ opinion })}
                  />
                  <MdField
                    id="w-context" label={t('entry.context')}
                    hint={t('entry.contextHint')}
                    value={p.context} onChange={(context) => onWrite({ context })}
                  />
                </>
              ) : (
                <p className="notice" role="alert">
                  <span>{tRich('entry.migration', undefined, { code: (c) => <code>{c}</code> })}</span>
                </p>
              )}
            </section>

            {themes.map((theme) => {
              const list = themeTopics(theme.id, topics)
              if (!list.length) return null
              const s = syntheses[`${p.id}|${theme.id}`] ?? emptySynthesis(p.id, theme.id)
              const suggest = shouldSuggestSynthesis(p.id, theme, topics, statuses, syntheses)
              return (
                <section key={theme.id} className="theme-block" aria-labelledby={`th-${theme.id}`}>
                  <h2 id={`th-${theme.id}`}>{theme.name}</h2>
                  <ul className="topic-list">
                    {list.map((x) => <TopicLink key={x.id} philosophyId={p.id} t={x} status={statuses[cellKey(p.id, x.id)] ?? 'empty'} />)}
                  </ul>
                  {suggest && (
                    <p className="notice" role="status">{t('entry.suggestSynthesis')}</p>
                  )}
                  <MdField
                    id={`synth-${theme.id}`}
                    label={t('entry.themeSynthesis')}
                    hint={synthesisQuestion(p.name, theme.name, p.ref, p.plural)}
                    value={s.body}
                    onChange={(body) => onSynthesis({ ...s, body, status: body.trim() ? (s.status === 'deep' ? 'deep' : 'draft') : 'empty' })}
                  />
                </section>
              )
            })}

            {own.length > 0 && (
              <section className="theme-block own-block" aria-labelledby="own-h">
                <h2 id="own-h"><HandStar size={20} />{ownLabel(p.name, p.ref)}</h2>
                <ul className="topic-list">
                  {own.map((x) => <TopicLink key={x.id} philosophyId={p.id} t={x} status={statuses[cellKey(p.id, x.id)] ?? 'empty'} />)}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
