import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { philosophies } from './seed'
import { statueCaption, statueFor, statues } from './statues'

const root = join(__dirname, '..', '..')
const OK_LICENSE = /^(CC0|CC BY(-SA)? [0-9.]+|CC BY(-SA)?$|Public domain|PD[- ]|Attribution)/i

describe('statues du créateur', () => {
  it('chaque philosophie a une entrée, et une seule', () => {
    expect(statues).toHaveLength(philosophies.length)
    expect(new Set(statues.map((s) => s.philosophy)).size).toBe(philosophies.length)
    const ids = new Set(philosophies.map((p) => p.id))
    expect(statues.every((s) => ids.has(s.philosophy))).toBe(true)
  })

  it('chaque photo existe dans public/statues, est légère et porte son crédit et sa licence libre', () => {
    const withPhoto = statues.filter((s) => s.file)
    expect(withPhoto.length).toBeGreaterThanOrEqual(75)
    for (const s of withPhoto) {
      const path = join(root, 'public', 'statues', s.file)
      expect(existsSync(path), `${s.philosophy} : fichier manquant ${s.file}`).toBe(true)
      expect(statSync(path).size, `${s.file} trop lourd`).toBeLessThan(500_000)
      expect(s.who.trim(), `${s.philosophy} : qui est représenté`).not.toBe('')
      expect(s.author.trim(), `${s.philosophy} : auteur`).not.toBe('')
      expect(s.license, `${s.philosophy} : licence « ${s.license} »`).toMatch(OK_LICENSE)
      expect(s.page, `${s.philosophy} : page Commons`).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File(:|%3A)/)
    }
  })

  it('aucune photo n’est utilisée pour deux philosophies', () => {
    const files = statues.filter((s) => s.file).map((s) => s.file)
    expect(new Set(files).size).toBe(files.length)
  })

  it('une philosophie sans photo affiche un socle vide, jamais une image cassée', () => {
    for (const s of statues.filter((x) => !x.file)) {
      expect(s.page).toBe('')
      expect(s.license).toBe('')
    }
  })

  it('les 32 traditions sans créateur unique sont marquées symboliques', () => {
    const collective = philosophies.filter((p) => /tradition collective/i.test(p.founder)).map((p) => p.id)
    for (const id of collective) {
      const s = statueFor(id)!
      if (s.file) expect(s.symbolic, `${id} doit être marquée symbolique`).toBe(true)
    }
  })

  it('la légende dit clairement ce qu’on voit', () => {
    expect(statueCaption({ philosophy: 'x', who: 'Platon', symbolic: false, material: 'marbre', file: 'x.jpg', page: '', author: '', license: '' })).toBe('Statue de Platon')
    expect(statueCaption({ philosophy: 'x', who: 'Kant', symbolic: false, material: 'bronze', file: 'x.jpg', page: '', author: '', license: '' })).toBe('Statue en bronze de Kant')
    expect(statueCaption({ philosophy: 'x', who: 'Ma’ât', symbolic: true, material: 'pierre', file: 'x.jpg', page: '', author: '', license: '' })).toBe('Figure symbolique\u00A0: Ma’ât')
  })
})
