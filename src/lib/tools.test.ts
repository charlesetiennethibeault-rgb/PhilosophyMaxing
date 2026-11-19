import { describe, expect, it } from 'vitest'
import { allTopics, families, philosophies, themes, commonTopics } from './seed'
import {
  move, normalize, progressSummary, searchPhilosophies, shouldSuggestSynthesis, slugify, themeReady, themeTopics,
} from './tools'
import { buildBackup, parseBackup } from './backup'
import { cellKey, emptyNote, type Note, type NoteStatus } from './types'

const note = (p: string, t: string, patch: Partial<Note> = {}): Note => ({ ...emptyNote(p, t), ...patch })

describe('recherche', () => {
  it('ignore les accents et la casse', () => {
    expect(normalize('Épicure')).toBe('epicure')
    const r = searchPhilosophies('epicure', philosophies, [])
    expect(r.some((h) => h.philosophy.id === 'epicurisme')).toBe(true)
  })
  it('trouve par nom d’acteur', () => {
    const r = searchPhilosophies('marc aurele', philosophies, [])
    expect(r.map((h) => h.philosophy.id)).toContain('stoicisme')
    expect(r.find((h) => h.philosophy.id === 'stoicisme')!.matchedIn).toContain('acteur')
  })
  it('trouve par texte de mes notes, avec la note concernée', () => {
    const n = note('stoicisme', 'le-temps', { research: 'Le **memento mori** me touche', tags: ['urgence'] })
    const r = searchPhilosophies('memento', philosophies, [n])
    expect(r).toHaveLength(1)
    expect(r[0].philosophy.id).toBe('stoicisme')
    expect(r[0].notes).toEqual([n])
    expect(searchPhilosophies('urgence', philosophies, [n])).toHaveLength(1)
  })
  it('trouve dans mes écrits sur la philosophie (synthèse, avis, contexte)', () => {
    const list = philosophies.map((p) => (p.id === 'stoicisme' ? { ...p, context: 'Né à Athènes sous les portiques', opinion: 'Ça me calme' } : p))
    const r = searchPhilosophies('portiques', list, [])
    expect(r.map((h) => h.philosophy.id)).toEqual(['stoicisme'])
    expect(r[0].matchedIn).toContain('mes écrits')
    expect(searchPhilosophies('calme', list, [])).toHaveLength(1)
  })
  it('une recherche vide renvoie tout', () => {
    expect(searchPhilosophies('  ', philosophies, [])).toHaveLength(87)
  })
  it('plusieurs mots : tous doivent être trouvés', () => {
    expect(searchPhilosophies('stoicisme zzzzinconnu', philosophies, [])).toHaveLength(0)
  })
})

describe('progression', () => {
  it('global, par famille et par époque', () => {
    const statuses: Record<string, NoteStatus> = {
      [cellKey('lumieres', 'le-temps')]: 'deep',
      [cellKey('lumieres', 'sens-de-la-vie')]: 'deep',
      [cellKey('stoicisme', 'le-temps')]: 'draft',
    }
    const s = progressSummary(philosophies, allTopics, statuses, families)
    const total = 87 * 15 + 140
    expect(s.global.total).toBe(total)
    expect(s.global.deep).toBe(2)
    expect(s.global.draft).toBe(1)
    expect(s.byFamily.find((f) => f.family.id === 'moderne')!.deep).toBe(2)
    expect(s.byFamily.reduce((a, f) => a + f.total, 0)).toBe(total)
    expect(s.byEra.reduce((a, e) => a + e.total, 0)).toBe(total)
    expect(s.byEra.find((e) => e.era.id === 'moderne')!.deep).toBe(2)
  })
  it('les sujets désactivés ne comptent plus', () => {
    const off = allTopics.map((t) => (t.id === 'le-temps' ? { ...t, active: false } : t))
    expect(progressSummary(philosophies, off, {}, families).global.total).toBe(87 * 14 + 140)
  })
  it('0 % sans note', () => {
    expect(progressSummary(philosophies, allTopics, {}, families).global.pct).toBe(0)
  })
})

describe('synthèse par thème', () => {
  const theme = themes.find((t) => t.id === 'finitude')!
  const statusFor = (s: NoteStatus) =>
    Object.fromEntries(themeTopics('finitude', allTopics).map((t) => [cellKey('stoicisme', t.id), s]))

  it('le thème « Finitude et temps » compte 3 sujets', () => {
    expect(themeTopics('finitude', allTopics)).toHaveLength(3)
  })
  it('prêt quand tous les sujets sont au moins en brouillon', () => {
    expect(themeReady('stoicisme', 'finitude', allTopics, statusFor('draft'))).toBe(true)
    expect(themeReady('stoicisme', 'finitude', allTopics, statusFor('deep'))).toBe(true)
  })
  it('pas prêt s’il manque un sujet ou s’il est vide', () => {
    const s = statusFor('draft')
    s[cellKey('stoicisme', 'le-temps')] = 'empty'
    expect(themeReady('stoicisme', 'finitude', allTopics, s)).toBe(false)
    expect(themeReady('stoicisme', 'finitude', allTopics, {})).toBe(false)
  })
  it('suggère la synthèse seulement si elle est encore vide', () => {
    const s = statusFor('draft')
    expect(shouldSuggestSynthesis('stoicisme', theme, allTopics, s, {})).toBe(true)
    const written = { 'stoicisme|finitude': { philosophy: 'stoicisme', theme: 'finitude', body: 'Ma synthèse', status: 'draft' as const, updatedAt: '' } }
    expect(shouldSuggestSynthesis('stoicisme', theme, allTopics, s, written)).toBe(false)
  })
  it('un sujet commun désactivé ne bloque pas la suggestion', () => {
    const off = allTopics.map((t) => (t.id === 'le-temps' ? { ...t, active: false } : t))
    const s = statusFor('draft')
    delete s[cellKey('stoicisme', 'le-temps')]
    expect(themeReady('stoicisme', 'finitude', off, s)).toBe(true)
  })
})

describe('édition des listes', () => {
  it('slugify garantit un identifiant unique', () => {
    expect(slugify('Néo-Stoïcisme')).toBe('neo-stoicisme')
    expect(slugify('Stoïcisme', ['stoicisme'])).toBe('stoicisme-2')
    expect(slugify('Stoïcisme', ['stoicisme', 'stoicisme-2'])).toBe('stoicisme-3')
    expect(slugify('???')).toBe('element')
  })
  it('move réordonne et renumérote', () => {
    const list = [{ id: 'a', order: 1 }, { id: 'b', order: 2 }, { id: 'c', order: 3 }]
    expect(move(list, 'c', -1).map((x) => x.id)).toEqual(['a', 'c', 'b'])
    expect(move(list, 'a', -1).map((x) => x.id)).toEqual(['a', 'b', 'c']) // déjà en tête
    expect(move(list, 'c', 1).map((x) => x.id)).toEqual(['a', 'b', 'c']) // déjà en queue
    expect(move(list, 'a', 1).map((x) => x.order)).toEqual([1, 2, 3])
  })
})

describe('sauvegarde JSON', () => {
  const data = () => buildBackup({
    families, themes, philosophies, topics: allTopics, notes: [note('stoicisme', 'le-temps', { research: 'x' })],
    syntheses: [], draws: [],
    settings: { noRepeat: true, onlyRemaining: false, discovery: false, sound: true },
    filters: { families: [], eras: [], yearRange: null, regions: [], favoritesOnly: false, toVerifyOnly: false },
  })
  it('aller-retour : export puis import', () => {
    const r = parseBackup(JSON.stringify(data()))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.backup.philosophies).toHaveLength(87)
      expect(r.backup.topics.filter((t) => t.scope === 'common')).toHaveLength(commonTopics.length)
      expect(r.backup.notes[0].research).toBe('x')
    }
  })
  it('refuse un fichier invalide, étranger ou incohérent', () => {
    expect(parseBackup('pas du json')).toMatchObject({ ok: false })
    expect(parseBackup('{"app":"Autre"}')).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ ...data(), version: 99 }))).toMatchObject({ ok: false })
    const { syntheses: _s, ...partial } = data()
    expect(parseBackup(JSON.stringify(partial))).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ ...data(), notes: [note('inconnue', 'le-temps')] }))).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ ...data(), philosophies: [{ ...philosophies[0], family: 'nulle-part' }] }))).toMatchObject({ ok: false })
  })
})
