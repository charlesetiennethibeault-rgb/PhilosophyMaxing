import { statueCaption, statueFor, statueMaterialLabel, statueName, statueUrl } from '../lib/statues'
import { useLang } from '../i18n'

/** La statue du créateur de la philosophie, dans une niche de pierre (design.md §14). */
export default function StatueNiche({ philosophy }: { philosophy: { id: string; name: string; dateLabel: string; founder: string } }) {
  const { t, tRich } = useLang()
  const s = statueFor(philosophy.id)
  const hasPhoto = !!s?.file
  return (
    <figure className={`statue${hasPhoto ? '' : ' empty'}`}>
      <div className="niche">
        {hasPhoto ? (
          <img
            src={statueUrl(s!.file)} width={480} height={640} loading="lazy" decoding="async"
            alt={`${statueCaption(s!)}${s!.material && s!.material !== 'pierre' ? ` (${statueMaterialLabel(s!)})` : ''}`}
          />
        ) : (
          <svg className="niche-bust" viewBox="0 0 120 160" role="img" aria-label={t('statue.noPhoto')}>
            <path d="M60 22c-14 0-24 11-24 26 0 10 4 18 10 23-1 6-3 10-9 13-14 6-27 10-27 28v28h100v-28c0-18-13-22-27-28-6-3-8-7-9-13 6-5 10-13 10-23 0-15-10-26-24-26z" />
          </svg>
        )}
        <div className="plinth" aria-hidden="true" />
      </div>
      <figcaption>
        <span className="statue-who">{hasPhoto ? statueName(s!) : philosophy.founder.split(/ \(/)[0]}</span>
        <span className="statue-note">{philosophy.name}</span>
        <span className="statue-note">{philosophy.dateLabel}</span>
        {hasPhoto && (
          <span className="statue-credit">
            {tRich('statue.credit', { author: s!.author || t('statue.unknownAuthor'), license: s!.license }, {
              a: (c) => <a href={s!.page} target="_blank" rel="noopener noreferrer">{c}</a>,
            })}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
