import { describe, expect, it } from 'vitest'
import { allTopics, commonTopics, families, philosophies, themes, ownTopics } from './seed'
import {
  availableTopics, drawPhilosophy, drawTopic, emptyFilters, eraOf, matchesFilters,
  pickWeighted, topicsFor, wheelPhilosophies, type DrawContext,
} from './draw'
import { cellKey, type Draw, type DrawSettings } from './types'

const settings: DrawSettings = { noRepeat: true, onlyRemaining: false, discovery: false, sound: false }
const base = (over: Partial<DrawContext> = {}): DrawContext => ({
  philosophies: philosophies.map((p) => ({ ...p })),
  topics: allTopics,
  filters: emptyFilters,
  settings,
  history: [],
  statuses: {},
  ...over,
})
const drawn = (philosophy: string, topic: string): Draw => ({ type: 'topic', philosophy, topic, at: '2026-01-01' })

describe('données de départ', () => {
  it('compte 87 philosophies, 15 sujets communs, 5 thèmes, 9 familles', () => {
    expect(philosophies).toHaveLength(87)
    expect(commonTopics).toHaveLength(15)
    expect(themes).toHaveLength(5)
    expect(families).toHaveLength(9)
  })
  it('identifiants uniques et familles valides', () => {
    expect(new Set(philosophies.map((p) => p.id)).size).toBe(87)
    const fam = new Set(families.map((f) => f.id))
    expect(philosophies.every((p) => fam.has(p.family))).toBe(true)
  })
  it('chaque fiche générée est à vérifier, avec 2 à 5 acteurs', () => {
    expect(philosophies.every((p) => p.aVerifier)).toBe(true)
    expect(philosophies.every((p) => p.actors.length >= 2 && p.actors.length <= 5)).toBe(true)
    expect(ownTopics.every((t) => t.aVerifier)).toBe(true)
  })
  it('0 à 4 sujets propres par philosophie', () => {
    for (const p of philosophies) {
      const n = ownTopics.filter((t) => t.philosophy === p.id).length
      expect(n).toBeLessThanOrEqual(4)
    }
  })
  it('5 thèmes regroupent bien les 15 sujets (3, 3, 2, 4, 3)', () => {
    const count = themes.map((t) => commonTopics.filter((s) => s.theme === t.id).length)
    expect(count).toEqual([3, 3, 2, 4, 3])
  })
})

describe('sujets propres', () => {
  it("n'apparaissent que pour leur philosophie", () => {
    const stoic = topicsFor('stoicisme', allTopics)
    expect(stoic.filter((t) => t.scope === 'own').every((t) => t.philosophy === 'stoicisme')).toBe(true)
    expect(stoic.some((t) => t.name === 'La dichotomie du contrôle')).toBe(true)
    const epic = topicsFor('epicurisme', allTopics)
    expect(epic.some((t) => t.name === 'La dichotomie du contrôle')).toBe(false)
  })
  it('une philosophie sans sujet propre a exactement les 15 communs', () => {
    expect(topicsFor('lumieres', allTopics)).toHaveLength(15)
  })
  it('un sujet commun désactivé disparaît de la roue', () => {
    const off = allTopics.map((t) => (t.id === 'le-temps' ? { ...t, active: false } : t))
    expect(topicsFor('lumieres', off)).toHaveLength(14)
  })
})

describe('filtres', () => {
  it('par famille, région, favoris, à vérifier', () => {
    const p = philosophies[0]
    expect(matchesFilters(p, { ...emptyFilters, families: [p.family] })).toBe(true)
    expect(matchesFilters(p, { ...emptyFilters, families: ['afrique'] })).toBe(false)
    expect(matchesFilters(p, { ...emptyFilters, regions: ['Afrique'] })).toBe(false)
    expect(matchesFilters(p, { ...emptyFilters, favoritesOnly: true })).toBe(false)
    expect(matchesFilters({ ...p, favorite: true }, { ...emptyFilters, favoritesOnly: true })).toBe(true)
    expect(matchesFilters({ ...p, aVerifier: false }, { ...emptyFilters, toVerifyOnly: true })).toBe(false)
  })
  it('par époque (frontières)', () => {
    expect(eraOf(-300)).toBe('antiquite')
    expect(eraOf(499)).toBe('antiquite')
    expect(eraOf(500)).toBe('moyen-age')
    expect(eraOf(1500)).toBe('moderne')
    expect(eraOf(1800)).toBe('xixe')
    expect(eraOf(1900)).toBe('xxe')
    expect(eraOf(2011)).toBe('xxie')
  })
  it('par curseur d’années', () => {
    const ctx = base({ filters: { ...emptyFilters, yearRange: [-600, -300] } })
    const wheel = wheelPhilosophies(ctx)
    expect(wheel.length).toBeGreaterThan(0)
    expect(wheel.every((p) => p.startYear >= -600 && p.startYear <= -300)).toBe(true)
  })
  it('la roue est recalculée avec les seules parts retenues', () => {
    const ctx = base({ filters: { ...emptyFilters, families: ['afrique'] } })
    expect(wheelPhilosophies(ctx)).toHaveLength(6)
  })
  it('une philosophie en réserve sort de la roue sans être supprimée', () => {
    const ctx = base()
    ctx.philosophies[0].reserve = true
    expect(wheelPhilosophies(ctx)).toHaveLength(86)
    expect(ctx.philosophies).toHaveLength(87)
  })
})

describe('non-répétition', () => {
  it('les cases déjà tirées sont retirées de la roue des sujets', () => {
    const ctx = base({ history: [drawn('stoicisme', 'le-temps')] })
    const ids = availableTopics('stoicisme', ctx).map((t) => t.id)
    expect(ids).not.toContain('le-temps')
    expect(ids).toHaveLength(15 + 3 - 1)
  })
  it("une case tirée pour une autre philosophie n'affecte pas celle-ci", () => {
    const ctx = base({ history: [drawn('epicurisme', 'le-temps')] })
    expect(availableTopics('stoicisme', ctx).map((t) => t.id)).toContain('le-temps')
  })
  it('désactivée, rien n’est retiré', () => {
    const ctx = base({ settings: { ...settings, noRepeat: false }, history: [drawn('stoicisme', 'le-temps')] })
    expect(availableTopics('stoicisme', ctx)).toHaveLength(18)
  })
  it('une philosophie dont toutes les cases sont tirées sort de la roue', () => {
    const history = topicsFor('lumieres', allTopics).map((t) => drawn('lumieres', t.id))
    const ctx = base({ history })
    expect(wheelPhilosophies(ctx).map((p) => p.id)).not.toContain('lumieres')
    expect(wheelPhilosophies(ctx)).toHaveLength(86)
  })
  it('un tirage de philosophie (type philosophy) ne compte pas comme case tirée', () => {
    const ctx = base({ history: [{ type: 'philosophy', philosophy: 'stoicisme', at: 'x' }] })
    expect(availableTopics('stoicisme', ctx)).toHaveLength(18)
  })
})

describe('« seulement ce qui reste à faire »', () => {
  it('exclut les cases approfondies, pas les brouillons', () => {
    const statuses = {
      [cellKey('stoicisme', 'le-temps')]: 'deep' as const,
      [cellKey('stoicisme', 'sens-de-la-vie')]: 'draft' as const,
    }
    const ctx = base({ settings: { ...settings, noRepeat: false, onlyRemaining: true }, statuses })
    const ids = availableTopics('stoicisme', ctx).map((t) => t.id)
    expect(ids).not.toContain('le-temps')
    expect(ids).toContain('sens-de-la-vie')
  })
  it('sans l’option, les approfondies restent tirables', () => {
    const statuses = { [cellKey('stoicisme', 'le-temps')]: 'deep' as const }
    const ctx = base({ settings: { ...settings, noRepeat: false }, statuses })
    expect(availableTopics('stoicisme', ctx).map((t) => t.id)).toContain('le-temps')
  })
  it('retire une philosophie entièrement approfondie', () => {
    const statuses = Object.fromEntries(topicsFor('lumieres', allTopics).map((t) => [cellKey('lumieres', t.id), 'deep' as const]))
    const ctx = base({ settings: { ...settings, noRepeat: false, onlyRemaining: true }, statuses })
    expect(wheelPhilosophies(ctx).map((p) => p.id)).not.toContain('lumieres')
  })
})

describe('mode découverte', () => {
  it('favorise la famille la moins approfondie', () => {
    const statuses = Object.fromEntries(
      topicsFor('lumieres', allTopics).map((t) => [cellKey('lumieres', t.id), 'deep' as const]),
    )
    const ctx = base({ settings: { ...settings, noRepeat: false, discovery: true }, statuses })
    let modern = 0
    let seq = 0
    const rng = () => ((seq = (seq * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 4000; i++) {
      const r = drawPhilosophy(ctx, rng)
      if (r.ok && r.wheel[r.index].family === 'moderne') modern++
    }
    // 9/87 ≈ 10 % sans découverte ; nettement moins avec 15 notes approfondies dans la famille
    expect(modern / 4000).toBeLessThan(0.05)
  })
  it('sans notes approfondies, le tirage reste uniforme', () => {
    const ctx = base({ settings: { ...settings, noRepeat: false, discovery: true } })
    const counts = new Map<string, number>()
    let seq = 1
    const rng = () => ((seq = (seq * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 8700; i++) {
      const r = drawPhilosophy(ctx, rng)
      if (r.ok) counts.set(r.wheel[r.index].id, (counts.get(r.wheel[r.index].id) ?? 0) + 1)
    }
    expect(counts.size).toBe(87)
  })
  it('pickWeighted respecte les poids', () => {
    expect(pickWeighted([0, 1, 0], () => 0.5)).toBe(1)
    expect(pickWeighted([1, 0, 0], () => 0.999)).toBe(0)
  })
})

describe('plus aucune case disponible', () => {
  it('signale l’épuisement quand tout est tiré', () => {
    const history = philosophies.flatMap((p) => topicsFor(p.id, allTopics).map((t) => drawn(p.id, t.id)))
    const r = drawPhilosophy(base({ history }))
    expect(r).toEqual({ ok: false, reason: 'exhausted' })
  })
  it('distingue « aucun résultat pour ces filtres »', () => {
    const r = drawPhilosophy(base({ filters: { ...emptyFilters, families: ['afrique'], regions: ['Océanie'] } }))
    expect(r).toEqual({ ok: false, reason: 'no-match' })
  })
  it('la roue des sujets signale aussi l’épuisement', () => {
    const history = topicsFor('lumieres', allTopics).map((t) => drawn('lumieres', t.id))
    expect(drawTopic('lumieres', base({ history }))).toEqual({ ok: false, reason: 'exhausted' })
  })
  it('un tirage valide renvoie une case disponible', () => {
    const ctx = base({ history: [drawn('stoicisme', 'le-temps')] })
    const r = drawTopic('stoicisme', ctx, () => 0)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.wheel[r.index].id).not.toBe('le-temps')
  })
})
