import { RECORD_DRAWS } from '../lib/config'
import { href } from '../lib/route'
import { sortedHistory } from '../lib/tools'
import type { Draw, Philosophy, Topic } from '../lib/types'

interface Props {
  history: Draw[]
  philosophies: Philosophy[]
  topics: Topic[]
}

const fmt = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeStyle: 'short' })

export default function HistoryList({ history, philosophies, topics }: Props) {
  const rows = sortedHistory(history)
  const pName = (id: string) => philosophies.find((p) => p.id === id)?.name
  const tName = (id: string) => topics.find((t) => t.id === id)?.name

  if (rows.length === 0) {
    return (
      <div className="empty">
        <h2>Aucun tirage enregistré</h2>
        <p>
          {RECORD_DRAWS
            ? 'Chaque tirage de la roue apparaîtra ici, daté, avec un lien vers la fiche ou la note.'
            : 'L’enregistrement des tirages est désactivé pendant le développement de base. Il sera activé quand tu le décideras : l’historique se remplira alors tout seul.'}
        </p>
        <a className="btn btn-secondary" href={href(['roue'])}>Aller à la roue</a>
      </div>
    )
  }

  return (
    <div className="hlist">
      <p className="meta">{rows.length}&nbsp;tirage{rows.length > 1 ? 's' : ''}</p>
      <ul className="rows">
        {rows.map((d, i) => {
          const name = pName(d.philosophy)
          const topic = d.topic ? tName(d.topic) : undefined
          const gone = !name || (d.topic && !topic)
          const to = d.topic ? href(['note', d.philosophy, d.topic]) : href(['carnet', 'fiche', d.philosophy])
          const inner = (
            <span className="row-main">
              <strong>{name ?? 'Philosophie supprimée'}{topic && <> · {topic}</>}</strong>
              <span className="meta">{d.type === 'topic' ? 'Sujet tiré' : 'Philosophie tirée'} · <time dateTime={d.at}>{fmt.format(new Date(d.at))}</time></span>
            </span>
          )
          return <li key={d.id ?? `${d.at}-${i}`}>{gone ? <span className="row-link disabled">{inner}</span> : <a className="row-link" href={to}>{inner}</a>}</li>
        })}
      </ul>
    </div>
  )
}
