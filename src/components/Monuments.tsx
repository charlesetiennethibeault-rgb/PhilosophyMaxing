import decor from '../lib/decor.json'

const url = (file: string) => `${import.meta.env.BASE_URL}decor/${file}`

/** Frise de vraies gravures de Piranesi (domaine public ou CC0, Wikimedia Commons), au pied de chaque écran. */
export default function Monuments() {
  return (
    <footer className="monuments" aria-label="Gravures de Rome">
      <ul className="monuments-row">
        {decor.monuments.map((m) => (
          <li key={m.file} className="monument">
            <a href={m.page} target="_blank" rel="noopener noreferrer">
              <figure>
                <img src={url(m.file)} width={640} height={480} loading="lazy" decoding="async" alt={`Gravure de Piranesi : ${m.label}`} />
                <figcaption>{m.label}</figcaption>
              </figure>
            </a>
          </li>
        ))}
      </ul>
      <p className="monuments-credit">
        Gravures de Giovanni Battista Piranesi (XVIIIe siècle), domaine public ou CC0 ·{' '}
        <a href={decor.carte.page} target="_blank" rel="noopener noreferrer">Table de Peutinger</a> (carte routière romaine, domaine public) ·{' '}
        <a href={decor.pilier.page} target="_blank" rel="noopener noreferrer">colonnes du Panthéon</a> · Wikimedia Commons.
      </p>
    </footer>
  )
}
