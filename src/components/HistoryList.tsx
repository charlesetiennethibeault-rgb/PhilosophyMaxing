import { RECORD_DRAWS } from '../lib/config'
import { sortedHistory } from '../lib/tools'
import type { Draw, Philosophy, Topic } from '../lib/types'

interface Props {
  history: Draw[]
  philosophies: Philosophy[]
  topics: Topic[]
  onOpenFiche: (philosophyId: string) => void
  onOpenNote: (philosophyId: string, topicId: string) => void
}

const fmt = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeStyle: 'short' })

export default function HistoryList({ history, philosophies, topics, onOpenFiche, onOpenNote }: Props) {
  const rows = sortedHistory(history)
  const pName = (id: string) => philosophies.find((p) => p.id === id)?.name
  const tName = (id: string) => topics.find((t) => t.id === id)?.name

  return (
    <div className="hlist">
      {!RECORD_DRAWS && (
        <p className="notice" role="status">
          Pendant le développement de base, les tirages ne sont pas enregistrés : cet historique se remplira quand tu m’autoriseras à l’activer.
        </p>
      )}
      <p className="count">{rows.length} tirage{rows.length > 1 ? 's' : ''}</p>
      <ul className="nlist-items">
        {rows.map((d, i) => {
          const name = pName(d.philosophy)
          const topic = d.topic ? tName(d.topic) : undefined
          const gone = !name || (d.topic && !topic)
          return (
            <li key={d.id ?? `${d.at}-${i}`}>
              <button
                type="button" className="nlist-item" disabled={!!gone}
                onClick={() => (d.topic ? onOpenNote(d.philosophy, d.topic) : onOpenFiche(d.philosophy))}
              >
                <span className="nlist-title">{d.type === 'topic' ? 'Sujet' : 'Philosophie'} <span className="sep">·</span> {name ?? 'philosophie supprimée'}{topic && <> <span className="sep">·</span> {topic}</>}</span>
                <span className="plist-sub"><time dateTime={d.at}>{fmt.format(new Date(d.at))}</time></span>
              </button>
            </li>
          )
        })}
        {rows.length === 0 && <li className="md-empty">Aucun tirage enregistré.</li>}
      </ul>
    </div>
  )
}
