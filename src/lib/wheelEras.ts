import type { EraId, Philosophy } from './types'

/**
 * La roue évolue avec le temps : une roue par période, de la meule de pierre à la jante moderne.
 * XXe et XXIe partagent la même roue (le XXIe ne compte qu'une philosophie).
 */
export type WheelEra = 'all' | 'antiquite' | 'moyen-age' | 'moderne' | 'xixe' | 'xxe'

export interface WheelEraInfo {
  id: WheelEra
  label: string
  /** Libellé court sous la mini-roue de la frise. */
  short: string
  /** Époques de filtre correspondantes ([] = toutes). */
  eras: EraId[]
  /** La roue de cette période, décrite pour les lecteurs d'écran. */
  object: string
}

export const WHEEL_ERAS: WheelEraInfo[] = [
  { id: 'all', label: 'Toutes les époques', short: 'Toutes', eras: [], object: 'roue complète' },
  { id: 'antiquite', label: 'Antiquité', short: 'Antiquité', eras: ['antiquite'], object: 'meule de pierre' },
  { id: 'moyen-age', label: 'Moyen Âge', short: 'Moyen Âge', eras: ['moyen-age'], object: 'roue de bois pleine' },
  { id: 'moderne', label: 'Époque moderne', short: 'Moderne', eras: ['moderne'], object: 'roue de charrette à rayons' },
  { id: 'xixe', label: 'XIXe siècle', short: 'XIXe', eras: ['xixe'], object: 'roue à rayons de fer' },
  { id: 'xxe', label: 'XXe et XXIe siècles', short: 'XXe–XXIe', eras: ['xxe', 'xxie'], object: 'pneu sur jante moderne' },
]

export const wheelEraInfo = (id: WheelEra) => WHEEL_ERAS.find((w) => w.id === id)!

/** Roue d'une époque de filtre (le XXIe prend la roue du XXe). */
export function wheelEraOf(era: EraId): Exclude<WheelEra, 'all'> {
  return era === 'xxie' ? 'xxe' : era
}

/**
 * Roue à afficher d'après les époques filtrées : une seule période (ou XXe + XXIe) = sa roue,
 * aucune ou plusieurs périodes mêlées = la roue complète.
 */
export function wheelEraForFilters(eras: EraId[]): WheelEra {
  if (eras.length === 0) return 'all'
  const set = new Set(eras.map(wheelEraOf))
  return set.size === 1 ? [...set][0] : 'all'
}

/** Époques de filtre à appliquer quand on choisit une roue dans la frise. */
export const erasForWheelEra = (id: WheelEra): EraId[] => [...wheelEraInfo(id).eras]

/** Sur une roue de période, les parts se suivent dans l'ordre chronologique (sens horaire). */
export function orderForWheel<T extends Pick<Philosophy, 'startYear' | 'order'>>(list: T[], era: WheelEra): T[] {
  if (era === 'all') return list
  return [...list].sort((a, b) => a.startYear - b.startYear || a.order - b.order)
}
