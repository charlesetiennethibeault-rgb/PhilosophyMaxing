import { describe, expect, it } from 'vitest'
import { aplatColor, catalogNumber, contrast, frQuestion, ON_BRAND, ownLabel, withArticle } from './ui'
import { families } from './seed'

describe('textes français', () => {
  it('ajoute l’article des courants en « -isme »', () => {
    expect(withArticle('Stoïcisme')).toBe('le stoïcisme')
    expect(withArticle('Épicurisme')).toBe('l’épicurisme')
    expect(withArticle('Hédonisme cyrénaïque')).toBe('l’hédonisme cyrénaïque')
    expect(withArticle('Ubuntu')).toBe('Ubuntu')
    expect(withArticle('Nietzsche')).toBe('Nietzsche')
  })
  it('corrige « de le » et « de les » et met une espace insécable avant « ? »', () => {
    expect(frQuestion('Que dit [philosophie] de le temps ?', 'Stoïcisme')).toBe('Que dit le stoïcisme du temps ?')
    expect(frQuestion('Que dit [philosophie] de les sens ?', 'Ubuntu')).toBe('Que dit Ubuntu des sens ?')
    expect(frQuestion('Que dit [philosophie] de la mort ?', 'Taoïsme')).toBe('Que dit le taoïsme de la mort ?')
  })
  it('étiquette « Propre à … »', () => {
    expect(ownLabel('Stoïcisme')).toBe('Propre au stoïcisme')
    expect(ownLabel('Épicurisme')).toBe('Propre à l’épicurisme')
    expect(ownLabel('Nietzsche')).toBe('Propre à Nietzsche')
  })
  it('numéro de catalogue avec espaces insécables', () => {
    expect(catalogNumber(42, 87)).toBe('N° 042 / 087')
  })
})

describe('aplat de famille', () => {
  it('garantit 4,5:1 contre le texte clair pour chaque couleur de famille', () => {
    for (const f of families) expect(contrast(ON_BRAND, aplatColor(f.color))).toBeGreaterThanOrEqual(4.5)
  })
  it('garde la couleur d’origine quand le contraste est déjà suffisant', () => {
    expect(aplatColor('#34447A')).toBe('#34447a')
  })
})
