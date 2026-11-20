import decor from '../lib/decor.json'
import { useLang } from '../i18n'

/** Crédit du décor : gravure du Panthéon (colonnes) et Table de Peutinger, domaine public ou CC0, Wikimedia Commons. */
export default function Monuments() {
  const { tRich } = useLang()
  return (
    <footer className="monuments">
      <p className="monuments-credit">
        {tRich('monuments.credit', undefined, {
          a1: (c) => <a href={decor.pilier.page} target="_blank" rel="noopener noreferrer">{c}</a>,
          a2: (c) => <a href={decor.carte.page} target="_blank" rel="noopener noreferrer">{c}</a>,
        })}
      </p>
    </footer>
  )
}
