import { families } from './seed'

/** Icône textuelle et motif de la roue, pour ne pas dépendre de la couleur seule. */
export const FAMILY_GLYPHS = ['◆', '●', '▲', '■', '✚', '✦', '⬟', '◐', '✿']

export const familyIndex = (id: string) => families.findIndex((f) => f.id === id)
export const familyById = (id: string) => families.find((f) => f.id === id)!

export const OCHRE = '#C9962B'

/** Écrit « Propre au stoïcisme » avec l'article voulu. */
export function ownLabel(philosophyName: string): string {
  const n = philosophyName.replace(/ \(.*\)$/, '')
  // Les noms de courants en « -isme » prennent l'article ; les autres (noms propres, traditions) restent tels quels.
  if (/^\S+isme\b/i.test(n) || /^\S+isme$/i.test(n.split(' ')[0])) {
    const lower = n.charAt(0).toLowerCase() + n.slice(1)
    return /^[aeiouyéèêâîôûœ]/i.test(lower) ? `Propre à l’${lower}` : `Propre au ${lower}`
  }
  return `Propre à ${n}`
}
