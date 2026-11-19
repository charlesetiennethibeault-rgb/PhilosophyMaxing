import { useEffect, useRef, useState } from 'react'

/**
 * Indicateur de chargement sans clignotement : rien avant `delay` ms (chargement rapide),
 * puis visible au moins `min` ms une fois apparu.
 */
export function useLoadingIndicator(loading: boolean, delay = 200, min = 400) {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)
  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => { shownAt.current = Date.now(); setVisible(true) }, delay)
      return () => clearTimeout(t)
    }
    if (!visible) return
    const left = Math.max(0, min - (Date.now() - shownAt.current))
    const t = setTimeout(() => setVisible(false), left)
    return () => clearTimeout(t)
  }, [loading, visible, delay, min])
  return visible
}
