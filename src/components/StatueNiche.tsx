import { statueCaption, statueFor, statueUrl } from '../lib/statues'

/** La statue du créateur de la philosophie, dans une niche de pierre (design.md §14). */
export default function StatueNiche({ philosophyId, philosophyName }: { philosophyId: string; philosophyName: string }) {
  const s = statueFor(philosophyId)
  const hasPhoto = !!s?.file
  return (
    <figure className={`statue${hasPhoto ? '' : ' empty'}`}>
      <div className="niche">
        {hasPhoto ? (
          <img
            src={statueUrl(s!.file)} width={480} height={640} loading="lazy" decoding="async"
            alt={`${statueCaption(s!)}${s!.material && s!.material !== 'pierre' ? ` (${s!.material})` : ''}`}
          />
        ) : (
          <span className="niche-empty">Socle vide</span>
        )}
        <div className="plinth" aria-hidden="true" />
      </div>
      <figcaption>
        <span className="statue-who">{hasPhoto ? statueCaption(s!) : `Pas de statue pour ${philosophyName}`}</span>
        {s?.symbolic && <span className="statue-note">Pas de créateur unique : choix symbolique.</span>}
        {!hasPhoto && s && <span className="statue-note">Aucune statue libre de droits trouvée.</span>}
        {hasPhoto && (
          <span className="statue-credit">
            Photo : {s!.author || 'auteur inconnu'}, {s!.license} ·{' '}
            <a href={s!.page} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
          </span>
        )}
      </figcaption>
    </figure>
  )
}
