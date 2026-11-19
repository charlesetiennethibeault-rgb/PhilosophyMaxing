import { useMemo } from 'react'
import FamilyMark from './FamilyMark'
import { useData } from '../lib/DataContext'
import { href } from '../lib/route'
import { progressSummary, type Progress as P } from '../lib/tools'
import type { NoteStatus, Philosophy, Topic } from '../lib/types'

interface Props { philosophies: Philosophy[]; topics: Topic[]; statuses: Record<string, NoteStatus> }

function Bar({ label, p, color, mark }: { label: string; p: P; color?: string; mark?: number }) {
  const draftPct = p.total ? (100 * p.draft) / p.total : 0
  return (
    <li className="pbar">
      <div className="pbar-head">
        <span className="pbar-label">{mark !== undefined && <FamilyMark index={mark} color={color ?? 'currentColor'} size={12} />}{label}</span>
        <span className="pbar-num"><strong>{p.pct}&nbsp;%</strong> · {p.deep}/{p.total}</span>
      </div>
      <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.pct} aria-valuetext={`${p.deep} sur ${p.total} approfondies`}>
        <span style={{ width: `${p.pct}%`, background: color }} />
        <span className="draft" style={{ width: `${draftPct}%` }} />
      </div>
    </li>
  )
}

export default function Progress({ philosophies, topics, statuses }: Props) {
  const { families } = useData()
  const s = useMemo(() => progressSummary(philosophies, topics, statuses, families), [philosophies, topics, statuses, families])
  const started = s.global.deep + s.global.draft > 0
  return (
    <main className="screen progress-view" id="main">
      <h1>Progression</h1>
      <section className="global" aria-label="Progression globale">
        <p className="big-pct">{s.global.pct}&nbsp;%</p>
        <p>des cases sont approfondies : <strong>{s.global.deep}</strong> sur {s.global.total.toLocaleString('fr-CA')}, avec {s.global.draft} brouillon{s.global.draft > 1 ? 's' : ''} en cours.</p>
        <div className="bar" role="progressbar" aria-label="Progression globale" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.global.pct}>
          <span style={{ width: `${s.global.pct}%` }} />
          <span className="draft" style={{ width: `${s.global.total ? (100 * s.global.draft) / s.global.total : 0}%` }} />
        </div>
        <p className="meta">Barre pleine : approfondi. Barre claire : brouillon.</p>
        {!started && (
          <p className="empty-inline">Rien n’est encore commencé. <a href={href(['roue'])}>Tire une première philosophie</a> pour lancer la progression.</p>
        )}
      </section>
      <div className="prog-cols">
        <section>
          <h2>Par famille</h2>
          <ul className="pbars">{s.byFamily.map((f, i) => <Bar key={f.family.id} label={f.family.name} p={f} color={f.family.color} mark={i} />)}</ul>
        </section>
        <section>
          <h2>Par époque</h2>
          <ul className="pbars">{s.byEra.map((e) => <Bar key={e.era.id} label={e.era.label} p={e} />)}</ul>
        </section>
      </div>
    </main>
  )
}
