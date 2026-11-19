import type { NoteStatus, Philosophy, Topic } from '../lib/types'
import { themes } from '../lib/seed'
import { ownLabel } from '../lib/ui'

interface Props {
  philosophy: Philosophy
  topic: Topic
  status: NoteStatus
  onStatus: (s: NoteStatus) => void
  onBack: () => void
  onAgain: () => void
}

const STATUS_LABELS: Record<NoteStatus, string> = { empty: 'Vide', draft: 'Brouillon', deep: 'Approfondi' }

export default function TopicResult({ philosophy, topic, status, onStatus, onBack, onAgain }: Props) {
  const own = topic.scope === 'own'
  const theme = themes.find((t) => t.id === topic.theme)
  const question = topic.question.replace('[philosophie]', philosophy.name.replace(/ \(.*\)$/, ''))
  return (
    <article className={`card topic-card${own ? ' own' : ''}`} aria-labelledby="topic-title">
      <p className="fam-tag">{philosophy.name}</p>
      <h2 id="topic-title">{own && <span className="star" aria-hidden="true">★ </span>}{topic.name}</h2>
      {own ? (
        <p className="own-tag"><span aria-hidden="true">★</span> {ownLabel(philosophy.name)}</p>
      ) : (
        <p className="theme-tag">Thème : {theme?.name}</p>
      )}
      {topic.aVerifier && <span className="badge static">à vérifier</span>}
      <p className="question">{question}</p>

      {status === 'deep' && (
        <p className="notice" role="status">Tu as déjà approfondi cette case. Tu peux la relire ou la reprendre.</p>
      )}

      <fieldset className="statuses">
        <legend>État de la note</legend>
        {(['empty', 'draft', 'deep'] as NoteStatus[]).map((s) => (
          <label key={s} className={`seg${status === s ? ' on' : ''}`}>
            <input type="radio" name="status" checked={status === s} onChange={() => onStatus(s)} />
            {STATUS_LABELS[s]}
          </label>
        ))}
      </fieldset>

      <p className="placeholder-note">
        L’éditeur de notes Markdown arrive à la phase 2. Pour l’instant, tu peux déjà marquer l’état de la case.
      </p>

      <div className="actions">
        <button type="button" className="btn" onClick={onAgain}>Relancer la roue des sujets</button>
        <button type="button" className="btn" onClick={onBack}>Retour à la roue des philosophies</button>
      </div>
    </article>
  )
}
