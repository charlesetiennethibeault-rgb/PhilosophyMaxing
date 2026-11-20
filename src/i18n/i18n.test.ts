import { describe, expect, it } from 'vitest'
import { frTypo, resolve, type Txt } from './core'
import { MESSAGES } from './messages'

const forms = (t: Txt): string[] => (typeof t === 'string' ? [t] : [t.one, t.other])
const vars = (t: Txt) => new Set(forms(t).flatMap((s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1])).filter((v) => v !== 'count'))
const tags = (t: Txt) => new Set(forms(t).flatMap((s) => [...s.matchAll(/<(\w+)>/g)].map((m) => m[1])))
const entries = Object.entries(MESSAGES) as [string, { fr: Txt; en: Txt }][]

describe('traductions de l’interface', () => {
  it('chaque message existe en français et en anglais, sans texte vide', () => {
    for (const [key, m] of entries) {
      for (const lang of ['fr', 'en'] as const) {
        for (const s of forms(m[lang])) expect(s.trim(), `${key} (${lang})`).not.toBe('')
      }
    }
  })

  it('les deux langues utilisent les mêmes variables {nom}', () => {
    for (const [key, m] of entries) expect([...vars(m.en)].sort(), key).toEqual([...vars(m.fr)].sort())
  })

  it('les deux langues utilisent les mêmes balises <b>, <a>…', () => {
    for (const [key, m] of entries) expect([...tags(m.en)].sort(), key).toEqual([...tags(m.fr)].sort())
  })

  it('chaque balise ouverte est fermée', () => {
    for (const [key, m] of entries) {
      for (const lang of ['fr', 'en'] as const) {
        for (const s of forms(m[lang])) {
          const open = [...s.matchAll(/<(\w+)>/g)].length
          const close = [...s.matchAll(/<\/(\w+)>/g)].length
          expect(close, `${key} (${lang})`).toBe(open)
        }
      }
    }
  })

  it('l’anglais n’a ni guillemets français ni espace avant « : ; ? ! »', () => {
    for (const [key, m] of entries) {
      for (const s of forms(m.en)) {
        expect(s, key).not.toMatch(/[«»]/)
        expect(s, key).not.toMatch(/[  ][:;?!]/)
        expect(s, key).not.toMatch(/ [:;?!]/)
      }
    }
  })
})

describe('typographie française', () => {
  it('met une espace insécable avant « : ; ? ! » et dans les guillemets', () => {
    expect(frTypo('Que dit-il : rien ?')).toBe('Que dit-il : rien ?')
    expect(frTypo('Supprimer « Stoïcisme » ?')).toBe('Supprimer « Stoïcisme » ?')
  })

  it('accorde singulier et pluriel et insère les valeurs', () => {
    expect(resolve(MESSAGES['nlist.count'], 'fr', { count: 1 })).toBe('1 note')
    expect(resolve(MESSAGES['nlist.count'], 'fr', { count: 3 })).toBe('3 notes')
    expect(resolve(MESSAGES['wheel.hintPhilosophies'], 'en', { count: 1 })).toBe('1 philosophy on the wheel')
    expect(resolve(MESSAGES['wheel.hintPhilosophies'], 'en', { count: 87 })).toBe('87 philosophies on the wheel')
    expect(resolve(MESSAGES['wheel.hintPhilosophies'], 'fr', { count: 0 })).toBe('0 philosophie sur la roue')
  })

  it('ne touche pas au texte inséré (nom saisi par l’utilisateur)', () => {
    expect(resolve(MESSAGES['named.deleteConfirm'], 'fr', { name: 'a : b' })).toBe('Supprimer « a : b » ?')
  })
})
