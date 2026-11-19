import { Check, ChevronRight, Star, X } from 'lucide-react'
import FamilyMark from './FamilyMark'
import { useData } from '../lib/DataContext'
import { aplatColor, catalogNumber } from '../lib/ui'
import type { Philosophy } from '../lib/types'

interface Props {
  philosophy: Philosophy
  number: number
  total: number
  progress: { deep: number; total: number }
  /** « aplat » : carte de résultat (couleur de la famille). « plain » : fiche, sans aplat. */
  variant?: 'aplat' | 'plain'
  onPatch: (patch: Partial<Philosophy>) => void
  onTopicWheel?: () => void
  onClose?: () => void
}

export default function PhilosophyCard({ philosophy: p, number, total, progress, variant = 'aplat', onPatch, onTopicWheel, onClose }: Props) {
  const { family, familyIdx } = useData()
  const fam = family(p.family)
  const aplat = variant === 'aplat'
  const pct = progress.total ? Math.round((100 * progress.deep) / progress.total) : 0

  return (
    <article className={`card result${aplat ? ' has-aplat' : ''}`} aria-labelledby="card-title">
      <header className="result-head" style={aplat ? { background: aplatColor(fam.color) } : undefined}>
        <div className="result-top">
          <p className="family-line">
            <FamilyMark index={familyIdx(p.family)} color={aplat ? 'currentColor' : fam.color} />
            {fam.name}
          </p>
          <div className="result-actions">
            <button
              type="button" className="icon-btn" aria-pressed={p.favorite}
              aria-label={p.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              onClick={() => onPatch({ favorite: !p.favorite })}
            ><Star size={20} aria-hidden="true" fill={p.favorite ? 'currentColor' : 'none'} /></button>
            {onClose && (
              <button type="button" className="icon-btn sheet-close" aria-label="Fermer la carte" onClick={onClose}><X size={20} aria-hidden="true" /></button>
            )}
          </div>
        </div>
        <h2 id="card-title" className={`result-name${p.name.length > 16 ? ' long' : ''}`}>{p.name}</h2>
        <p className="catalog">{catalogNumber(number, total)}</p>
      </header>

      <div className="result-body">
        <p className="desc">{p.description}</p>

        <dl className="facts">
          <div><dt>Période</dt><dd>{p.dateLabel}</dd></div>
          <div><dt>Région</dt><dd>{p.region}</dd></div>
          <div><dt>Fondateur ou origine</dt><dd>{p.founder}</dd></div>
          <div><dt>Principaux acteurs</dt><dd>{p.actors.join(', ')}</dd></div>
        </dl>

        <div className="progress-line" role="group" aria-label="Progression de cette philosophie">
          <div className="bar" role="progressbar" aria-label="Sujets approfondis" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${progress.deep} sujets approfondis sur ${progress.total}`}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="meta">{progress.deep}&nbsp;sujet{progress.deep > 1 ? 's' : ''} approfondi{progress.deep > 1 ? 's' : ''} sur&nbsp;{progress.total}</p>
        </div>

        <div className="verify-line">
          {p.aVerifier ? (
            <>
              <p className="meta">Fiche à vérifier : dates, fondateur et acteurs viennent d’un brouillon.</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPatch({ aVerifier: false })}>
                <Check size={16} aria-hidden="true" />Marquer comme vérifiée
              </button>
            </>
          ) : (
            <>
              <p className="meta ok"><Check size={16} aria-hidden="true" />Fiche vérifiée</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPatch({ aVerifier: true })}>Remettre à vérifier</button>
            </>
          )}
        </div>

        <label className="check">
          <input type="checkbox" checked={p.reserve} onChange={(e) => onPatch({ reserve: e.target.checked })} />
          <span>Mettre en réserve : sort de la roue sans être supprimée</span>
        </label>

        {onTopicWheel && (
          <button type="button" className="btn btn-primary btn-block" onClick={onTopicWheel}>
            Choisir un sujet<ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  )
}
