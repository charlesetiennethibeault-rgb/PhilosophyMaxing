import { RECORD_DRAWS } from '../lib/config'
import { useLang } from '../i18n'
import { href } from '../lib/route'
import { sortedHistory } from '../lib/tools'
import type { Draw, Philosophy, Topic } from '../lib/types'

interface Props {
  history: Draw[]
  philosophies: Philosophy[]
  topics: Topic[]
}

export default function HistoryList({ history, philosophies, topics }: Props) {
  const { t, date } = useLang()
  const rows = sortedHistory(history)
  const pName = (id: string) => philosophies.find((p) => p.id === id)?.name
  const tName = (id: string) => topics.find((x) => x.id === id)?.name

  if (rows.length === 0) {
    return (
      <div className="empty">
        <h2>{t('hist.emptyTitle')}</h2>
        <p>{RECORD_DRAWS ? t('hist.emptyOn') : t('hist.emptyOff')}</p>
        <a className="btn btn-secondary" href={href(['roue'])}>{t('common.goToWheel')}</a>
      </div>
    )
  }

  return (
    <div className="hlist">
      <p className="meta">{t('hist.count', { count: rows.length })}</p>
      <ul className="rows">
        {rows.map((d, i) => {
          const name = pName(d.philosophy)
          const topic = d.topic ? tName(d.topic) : undefined
          const gone = !name || (d.topic && !topic)
          const to = d.topic ? href(['note', d.philosophy, d.topic]) : href(['carnet', 'fiche', d.philosophy])
          const inner = (
            <span className="row-main">
              <strong>{name ?? t('hist.deleted')}{topic && <> · {topic}</>}</strong>
              <span className="meta">{d.type === 'topic' ? t('hist.topicDrawn') : t('hist.philosophyDrawn')} · <time dateTime={d.at}>{date(d.at, { dateStyle: 'long', timeStyle: 'short' })}</time></span>
            </span>
          )
          return <li key={d.id ?? `${d.at}-${i}`}>{gone ? <span className="row-link disabled">{inner}</span> : <a className="row-link" href={to}>{inner}</a>}</li>
        })}
      </ul>
    </div>
  )
}
