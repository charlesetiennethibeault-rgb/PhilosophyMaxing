import { describe, expect, it } from 'vitest'
import { eraOf } from './draw'
import { philosophies } from './seed'
import { WHEEL_ERAS, eraSelection, erasForWheelEra, orderForWheel, wheelEraForFilters, wheelEraOf } from './wheelEras'

describe('roues par période', () => {
  it('le XXIe prend la roue du XXe, les autres gardent la leur', () => {
    expect(wheelEraOf('xxie')).toBe('xxe')
    expect(wheelEraOf('xxe')).toBe('xxe')
    expect(wheelEraOf('antiquite')).toBe('antiquite')
    expect(wheelEraOf('moyen-age')).toBe('moyen-age')
  })

  it('une seule période filtrée donne sa roue ; sinon la roue complète', () => {
    expect(wheelEraForFilters([])).toBe('all')
    expect(wheelEraForFilters(['moderne'])).toBe('moderne')
    expect(wheelEraForFilters(['xxe', 'xxie'])).toBe('xxe')
    expect(wheelEraForFilters(['xxie'])).toBe('xxe')
    expect(wheelEraForFilters(['antiquite', 'moderne'])).toBe('all')
  })

  it('choisir une roue dans la frise filtre sur ses époques (XXe + XXIe ensemble)', () => {
    expect(erasForWheelEra('all')).toEqual([])
    expect(erasForWheelEra('xixe')).toEqual(['xixe'])
    expect(erasForWheelEra('xxe')).toEqual(['xxe', 'xxie'])
  })

  it('aller-retour : la roue déduite des époques choisies est celle qu’on a choisie', () => {
    for (const w of WHEEL_ERAS) expect(wheelEraForFilters(erasForWheelEra(w.id))).toBe(w.id)
  })

  it('chaque philosophie tombe sur exactement une roue de période, et aucune roue n’est vide', () => {
    const counts: Record<string, number> = {}
    for (const p of philosophies) {
      const w = wheelEraOf(eraOf(p.startYear))
      counts[w] = (counts[w] ?? 0) + 1
    }
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(87)
    expect(Object.keys(counts).sort()).toEqual(['antiquite', 'moderne', 'moyen-age', 'xixe', 'xxe'])
    expect(Math.min(...Object.values(counts))).toBeGreaterThanOrEqual(8) // plus de roue à une seule part
  })

  it('sur une roue de période, les parts sont dans l’ordre chronologique ; la roue complète garde son ordre', () => {
    const shuffled = [...philosophies].reverse()
    const ordered = orderForWheel(shuffled, 'antiquite')
    for (let i = 1; i < ordered.length; i++) expect(ordered[i].startYear).toBeGreaterThanOrEqual(ordered[i - 1].startYear)
    expect(orderForWheel(shuffled, 'all')).toBe(shuffled)
  })

  it('la frise ne coche une roue que si les époques filtrées lui correspondent exactement', () => {
    expect(eraSelection([])).toBe('all')
    expect(eraSelection(['moderne'])).toBe('moderne')
    expect(eraSelection(['xxie', 'xxe'])).toBe('xxe')
    expect(eraSelection(['xxe'])).toBeNull() // XXe seul : la frise propose XXe + XXIe ensemble
    expect(eraSelection(['antiquite', 'moderne'])).toBeNull() // combinaison absente de la frise
  })
})
