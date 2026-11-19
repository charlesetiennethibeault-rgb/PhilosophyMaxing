import { useMemo } from 'react'
import { useData } from '../lib/DataContext'
import { progressSummary, type Progress as P } from '../lib/tools'
import { glyphFor } from '../lib/ui'
import type { NoteStatus, Philosophy, Topic } from '../lib/types'

interface Props { philosophies: Philosophy[]; topics: Topic[]; statuses: Record<string, NoteStatus> }

function Bar({ label, p, color, glyph }: { label: string; p: P; color?: string; glyph?: string }) {
  return (
    <li className="pbar">
      <div className="pbar-head">
        <span>{glyph && <span className="swatch" style={{ background: color }} aria-hidden="true">{glyph}</span>} {label}</span>
        <span className="pbar-num"><strong>{p.pct} %</strong> · {p.deep}/{p.total}</span>
      </div>
      <div
        className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.pct}
        aria-valuetext={`${p.deep} sur ${p.total} approfondies`}
      >
        <span style={{ width: `${p.pct}%`, background: color }} />
        <span className="draft" style={{ width: `${p.total ? (100 * p.draft) / p.total : 0}%` }} />
      </div>
    </li>
  )
}

export default function Progress({ philosophies, topics, statuses }: Props) {
  const { families } = useData()
  const s = useMemo(() => progressSummary(philosophies, topics, statuses, families), [philosophies, topics, statuses, families])
  return (
    <main className="progress-view">
      <h2>Progression</h2>
      <section className="global">
        <p className="big-pct">{s.global.pct} %</p>
        <p>des cases sont approfondies : <strong>{s.global.deep}</strong> sur {s.global.total}, avec {s.global.draft} brouillon{s.global.draft > 1 ? 's' : ''} en cours.</p>
        <div className="bar" role="progressbar" aria-label="Progression globale" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.global.pct}>
          <span style={{ width: `${s.global.pct}%` }} />
          <span className="draft" style={{ width: `${s.global.total ? (100 * s.global.draft) / s.global.total : 0}%` }} />
        </div>
        <p className="hint">Barre pleine = approfondi ; barre claire = brouillon.</p>
      </section>
      <div className="prog-cols">
        <section>
          <h3>Par famille</h3>
          <ul className="pbars">{s.byFamily.map((f, i) => <Bar key={f.family.id} label={f.family.name} p={f} color={f.family.color} glyph={glyphFor(i)} />)}</ul>
        </section>
        <section>
          <h3>Par époque</h3>
          <ul className="pbars">{s.byEra.map((e) => <Bar key={e.era.id} label={e.era.label} p={e} />)}</ul>
        </section>
      </div>
    </main>
  )
}
