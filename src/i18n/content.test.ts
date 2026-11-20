import { describe, expect, it } from 'vitest'
import { allTopics, families, philosophies, themes } from '../lib/seed'
import { statues } from '../lib/statues'
import { frQuestion } from '../lib/ui'
import { localizeFamily, localizePhilosophy, localizeTheme, localizeTopic } from './content'
import { EN_FAMILIES, EN_MATERIALS, EN_PHILOSOPHIES, EN_STATUES, EN_THEMES, EN_TOPICS } from './content-en'
import { REGIONS } from '../lib/seed'
import { MESSAGES } from './messages'
import { storeLang } from './core'

describe('traduction du contenu : complétude', () => {
  it('chaque philosophie est traduite, avec le même nombre d’acteurs', () => {
    for (const p of philosophies) {
      const en = EN_PHILOSOPHIES[p.id]
      expect(en, `philosophie « ${p.id} » sans traduction`).toBeDefined()
      for (const k of ['name', 'dateLabel', 'founder', 'description'] as const) expect(en[k].trim(), `${p.id}.${k}`).not.toBe('')
      expect(en.actors, `${p.id} : acteurs`).toHaveLength(p.actors.length)
    }
    expect(Object.keys(EN_PHILOSOPHIES).sort()).toEqual(philosophies.map((p) => p.id).sort())
  })

  it('chaque sujet (commun ou propre) est traduit', () => {
    for (const t of allTopics) {
      const en = EN_TOPICS[t.id]
      expect(en, `sujet « ${t.id} » sans traduction`).toBeDefined()
      expect(en.name.trim()).not.toBe('')
      expect(en.short.trim()).not.toBe('')
      expect(en.question).toContain('[philosophy]')
    }
    expect(Object.keys(EN_TOPICS).sort()).toEqual(allTopics.map((t) => t.id).sort())
  })

  it('chaque famille, thème, région, statue et matière est traduit', () => {
    expect(Object.keys(EN_FAMILIES).sort()).toEqual(families.map((f) => f.id).sort())
    expect(Object.keys(EN_THEMES).sort()).toEqual(themes.map((t) => t.id).sort())
    for (const r of REGIONS) expect(`region.${r}` in MESSAGES, `région « ${r} »`).toBe(true)
    for (const s of statues.filter((x) => x.who)) expect(EN_STATUES[s.philosophy], `statue « ${s.philosophy} »`).toBeTruthy()
    for (const s of statues.filter((x) => x.material)) expect(EN_MATERIALS[s.material], `matière « ${s.material} »`).toBeTruthy()
  })

  it('aucun reste de français évident dans les textes anglais', () => {
    for (const [id, en] of Object.entries(EN_PHILOSOPHIES)) {
      expect(en.dateLabel, `${id}.dateLabel`).not.toMatch(/siècle|av\. J\.-C\.|années|depuis|vers /)
      expect(en.description, `${id}.description`).not.toMatch(/ (le|la|les|des|du|et|qui) /)
      expect(en.description.endsWith('.'), `${id} : point final`).toBe(true)
    }
    for (const [id, t] of Object.entries(EN_TOPICS)) expect(t.name, id).not.toMatch(/^(Le|La|Les|L’|L') /)
  })
})

describe('traduction du contenu : le texte de l’utilisateur est respecté', () => {
  const stoic = philosophies.find((p) => p.id === 'stoicisme')!

  it('français : rien ne change', () => {
    expect(localizePhilosophy(stoic, 'fr')).toBe(stoic)
  })

  it('anglais : un texte resté tel que fourni est traduit', () => {
    const en = localizePhilosophy(stoic, 'en')
    expect(en.name).toBe('Stoicism')
    expect(en.description).toBe(EN_PHILOSOPHIES.stoicisme.description)
    expect(en.actors).toContain('Marcus Aurelius')
  })

  it('anglais : un champ modifié par l’utilisateur reste tel quel, les autres sont traduits', () => {
    const edited = { ...stoic, description: 'Ma propre description du stoïcisme.' }
    const en = localizePhilosophy(edited, 'en')
    expect(en.description).toBe('Ma propre description du stoïcisme.')
    expect(en.name).toBe('Stoicism')
  })

  it('anglais : un nom renommé garde son nom, sans « ref » traduit', () => {
    const renamed = { ...stoic, name: 'Mon stoïcisme' }
    const en = localizePhilosophy(renamed, 'en')
    expect(en.name).toBe('Mon stoïcisme')
    expect(en.ref).toBeUndefined()
  })

  it('anglais : une philosophie créée par l’utilisateur est laissée intacte', () => {
    const mine = { ...stoic, id: 'ma-philo', name: 'Ma philo' }
    expect(localizePhilosophy(mine, 'en')).toBe(mine)
  })

  it('anglais : sujets, familles et thèmes, avec le même respect', () => {
    const topic = allTopics.find((t) => t.id === 'le-temps')!
    expect(localizeTopic(topic, 'en').name).toBe('Time')
    expect(localizeTopic({ ...topic, name: 'Mon temps' }, 'en').name).toBe('Mon temps')
    expect(localizeFamily(families[0], 'en').name).toBe('Greco-Roman antiquity')
    expect(localizeFamily({ ...families[0], name: 'Ma famille' }, 'en').name).toBe('Ma famille')
    expect(localizeTheme(themes[0], 'en').name).toBe('Finitude and time')
  })

  it('les questions anglaises s’accordent avec le nom (singulier ou pluriel)', () => {
    const q = EN_TOPICS['le-temps'].question
    expect(frQuestion(q, 'Stoïcisme', 'Stoicism', false)).toBe('What does Stoicism say about time?')
    expect(frQuestion(q, 'Sophistes', 'the Sophists', true)).toBe('What do the Sophists say about time?')
    expect(frQuestion(EN_TOPICS['platonisme--theorie-des-formes'].question, 'Platonisme', 'Platonism')).toBe('What does Platonism say about “Theory of Forms”?')
  })
})

storeLang('fr')
