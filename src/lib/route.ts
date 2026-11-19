import { useCallback, useEffect, useState } from 'react'

/** Routage par l'adresse (#/chemin?clé=valeur) : rafraîchir et « Précédent » fonctionnent. */
export interface Route { segments: string[]; params: URLSearchParams; raw: string }

const parse = (hash: string): Route => {
  const raw = hash.replace(/^#/, '') || '/'
  const [path, query = ''] = raw.split('?')
  return { segments: path.split('/').filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(query), raw }
}

let navCount = 0
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => { navCount++ })

export const href = (segments: string[], params?: Record<string, string | undefined>) => {
  const q = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([k, v]) => { if (v) q.set(k, v) })
  const qs = q.toString()
  return `#/${segments.map(encodeURIComponent).join('/')}${qs ? `?${qs}` : ''}`
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const navigate = useCallback((to: string) => { window.location.hash = to }, [])
  /** Change les paramètres sans ajouter d'entrée dans l'historique (recherche, filtres). */
  const setParams = useCallback((patch: Record<string, string | undefined>) => {
    const cur = parse(window.location.hash)
    Object.entries(patch).forEach(([k, v]) => { if (v) cur.params.set(k, v); else cur.params.delete(k) })
    const qs = cur.params.toString()
    const next = `#/${cur.segments.map(encodeURIComponent).join('/')}${qs ? `?${qs}` : ''}`
    window.history.replaceState(null, '', next)
    setRoute(parse(next))
  }, [])
  /** Retour : l'entrée précédente si elle est dans l'application, sinon l'accueil. */
  const back = useCallback(() => { if (navCount > 0) window.history.back(); else window.location.hash = '#/roue' }, [])
  return { route, navigate, setParams, back }
}
