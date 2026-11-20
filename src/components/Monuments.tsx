import decor from '../lib/decor.json'

/** Crédit du décor : gravure du Panthéon (colonnes) et Table de Peutinger, domaine public ou CC0, Wikimedia Commons. */
export default function Monuments() {
  return (
    <footer className="monuments">
      <p className="monuments-credit">
        Décor : <a href={decor.pilier.page} target="_blank" rel="noopener noreferrer">gravure du Panthéon</a> de Giovanni Battista Piranesi (colonnes, CC0) ·{' '}
        <a href={decor.carte.page} target="_blank" rel="noopener noreferrer">Table de Peutinger</a> (carte routière romaine, domaine public) · Wikimedia Commons.
      </p>
    </footer>
  )
}
