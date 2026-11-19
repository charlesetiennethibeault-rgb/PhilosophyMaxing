import type { Philosophy } from '../lib/types'
import { useData } from '../lib/DataContext'
import { glyphFor } from '../lib/ui'

interface Props {
  philosophy: Philosophy
  progress: { deep: number; total: number }
  onPatch: (patch: Partial<Pick<Philosophy, 'favorite' | 'reserve' | 'aVerifier'>>) => void
  onTopicWheel?: () => void
  onClose?: () => void
}

export default function PhilosophyCard({ philosophy: p, progress, onPatch, onTopicWheel, onClose }: Props) {
  const { family, familyIdx } = useData()
  const fam = family(p.family)
  return (
    <article className="card" style={{ ['--fam' as string]: fam.color }} aria-labelledby="card-title">
      <header>
        <p className="fam-tag">
          <span className="swatch" style={{ background: fam.color }} aria-hidden="true">{glyphFor(familyIdx(p.family))}</span>
          {fam.name}
        </p>
        <div className="row">
          <h2 id="card-title">{p.name}</h2>
          <button
            type="button" className={`icon-btn${p.favorite ? ' on' : ''}`}
            aria-pressed={p.favorite} aria-label={p.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onClick={() => onPatch({ favorite: !p.favorite })}
          >{p.favorite ? '★' : '☆'}</button>
          {onClose && <button type="button" className="icon-btn close" aria-label="Fermer la carte" onClick={onClose}>×</button>}
        </div>
        {p.aVerifier ? (
          <button type="button" className="badge" title="Cliquer pour retirer le marqueur une fois la fiche vérifiée" onClick={() => onPatch({ aVerifier: false })}>
            à vérifier ✕
          </button>
        ) : (
          <button type="button" className="badge ok" title="Rétablir le marqueur « à vérifier »" onClick={() => onPatch({ aVerifier: true })}>
            vérifiée ✓
          </button>
        )}
      </header>

      <p className="desc">{p.description}</p>

      <dl>
        <div><dt>Région</dt><dd>{p.region}</dd></div>
        <div><dt>Période</dt><dd>{p.dateLabel}</dd></div>
        <div><dt>Fondateur ou origine</dt><dd>{p.founder}</dd></div>
        <div><dt>Principaux acteurs</dt><dd>{p.actors.join(', ')}</dd></div>
      </dl>

      <div className="progress" role="group" aria-label="Progression de cette philosophie">
        <div className="bar"><span style={{ width: `${progress.total ? (100 * progress.deep) / progress.total : 0}%` }} /></div>
        <p>{progress.deep} sujet{progress.deep > 1 ? 's' : ''} sur {progress.total}</p>
      </div>

      <label className="check">
        <input type="checkbox" checked={p.reserve} onChange={(e) => onPatch({ reserve: e.target.checked })} />
        <span>En réserve (sortir de la roue sans supprimer)</span>
      </label>

      {onTopicWheel && (
        <button type="button" className="btn primary" onClick={onTopicWheel}>Tourner la roue des sujets</button>
      )}
    </article>
  )
}
