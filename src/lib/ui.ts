/** Aides visuelles. Les valeurs viennent de design.md et de src/styles/tokens.css. */

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const mix = (hex: string, towards: string, t: number) => {
  const a = parseInt(hex.slice(1), 16), b = parseInt(towards.slice(1), 16)
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t)
  return '#' + [ch(16), ch(8), ch(0)].map((c) => c.toString(16).padStart(2, '0')).join('')
}

export const TEXT = '#1C1510' // encre sombre (= --bg) : texte sur parts claires et assombrissement des aplats
export const ON_BRAND = '#FBF3E2' // --on-brand
export const SURFACE = '#F0E4CC' // parchemin (= --text) : filets et moyeu de la roue
export const OWN = '#D4A64A' // --own

/**
 * Aplat de famille : la couleur de la famille, assombrie vers --text jusqu'à 4,5:1 contre --on-brand.
 * `extra` assombrit encore (alternance des parts voisines sur la roue des sujets).
 */
export function aplatColor(hex: string, extra = 0): string {
  let t = 0
  while (t < 0.9 && contrast(ON_BRAND, mix(hex, TEXT, t)) < 4.5) t += 0.04
  return mix(hex, TEXT, Math.min(0.95, t + extra))
}

/** Écrit « Propre au stoïcisme » avec l'article voulu. */
export function ownLabel(philosophyName: string): string {
  const n = philosophyName.replace(/ \(.*\)$/, '')
  // Les noms de courants en « -isme » prennent l'article ; les autres (noms propres, traditions) restent tels quels.
  if (/^\S+[iï]sme$/i.test(n.split(' ')[0])) {
    const lower = n.charAt(0).toLowerCase() + n.slice(1)
    return /^[aeiouyéèêâîôûœ]/i.test(lower) ? `Propre à l’${lower}` : `Propre au ${lower}`
  }
  return `Propre à ${n}`
}

/** « le stoïcisme », « l'épicurisme » ; les noms propres et traditions restent tels quels. */
export function withArticle(philosophyName: string): string {
  const n = philosophyName.replace(/ \(.*\)$/, '')
  if (/^\S+[iï]sme$/i.test(n.split(' ')[0])) {
    const lower = n.charAt(0).toLowerCase() + n.slice(1)
    return /^[aeiouyéèêâîôûœh]/i.test(lower) ? `l’${lower}` : `le ${lower}`
  }
  return n
}

/** Question de recherche lisible : remplace [philosophie] et corrige « de le » en « du », « de les » en « des ». */
export function frQuestion(question: string, philosophyName: string): string {
  return question
    .replace('[philosophie]', withArticle(philosophyName))
    .replace(/\bde le /g, 'du ')
    .replace(/\bde les /g, 'des ')
    .replace(/ \?$/, ' ?')
}

/** Numéro de catalogue « N° 042 / 087 ». */
export const catalogNumber = (index: number, total: number) =>
  `N° ${String(index).padStart(3, '0')} / ${String(total).padStart(3, '0')}`

export const nb = ' '
