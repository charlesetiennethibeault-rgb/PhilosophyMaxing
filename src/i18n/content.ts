import { allTopics, families as seedFamilies, philosophies as seedPhilosophies, themes as seedThemes } from '../lib/seed'
import type { Family, Philosophy, Theme, Topic } from '../lib/types'
import { EN_FAMILIES, EN_MATERIALS, EN_PHILOSOPHIES, EN_STATUES, EN_THEMES, EN_TOPICS } from './content-en'
import type { Lang } from './core'

/**
 * Traduction du contenu fourni avec l'application (philosophies, sujets, familles, thèmes).
 *
 * Règle : on ne remplace un texte que s'il est encore identique à celui d'origine (le français du seed).
 * Si tu l'as modifié dans Gérer, ton texte reste tel quel ; un élément créé par toi n'a pas de traduction.
 * Les données enregistrées dans Supabase ne sont jamais modifiées : la traduction ne sert qu'à l'affichage.
 */

const seedPhilosophyById = new Map(seedPhilosophies.map((p) => [p.id, p]))
const seedTopicById = new Map(allTopics.map((t) => [t.id, t]))
const seedFamilyById = new Map(seedFamilies.map((f) => [f.id, f]))
const seedThemeById = new Map(seedThemes.map((t) => [t.id, t]))

/** Garde le texte de l'utilisateur s'il a changé, sinon prend la traduction. */
const same = (current: string, seed: string | undefined) => seed !== undefined && current === seed

export function localizePhilosophy(p: Philosophy, lang: Lang): Philosophy {
  if (lang === 'fr') return p
  const seed = seedPhilosophyById.get(p.id)
  const en = EN_PHILOSOPHIES[p.id]
  if (!seed || !en) return p
  const nameKept = !same(p.name, seed.name)
  return {
    ...p,
    name: same(p.name, seed.name) ? en.name : p.name,
    dateLabel: same(p.dateLabel, seed.dateLabel) ? en.dateLabel : p.dateLabel,
    founder: same(p.founder, seed.founder) ? en.founder : p.founder,
    actors: JSON.stringify(p.actors) === JSON.stringify(seed.actors) ? en.actors : p.actors,
    description: same(p.description, seed.description) ? en.description : p.description,
    // Comment en parler dans une phrase (« the Stoics », « Stoicism ») ; absent si le nom a été modifié.
    ref: nameKept ? undefined : en.ref ?? en.name,
    plural: nameKept ? undefined : en.plural,
  }
}

export function localizeTopic(t: Topic, lang: Lang): Topic {
  if (lang === 'fr') return t
  const seed = seedTopicById.get(t.id)
  const en = EN_TOPICS[t.id]
  if (!seed || !en) return t
  return {
    ...t,
    name: same(t.name, seed.name) ? en.name : t.name,
    short: same(t.short, seed.short) ? en.short : t.short,
    question: same(t.question, seed.question) ? en.question : t.question,
  }
}

export function localizeFamily(f: Family, lang: Lang): Family {
  if (lang === 'fr') return f
  const en = EN_FAMILIES[f.id]
  return en && same(f.name, seedFamilyById.get(f.id)?.name) ? { ...f, name: en } : f
}

export function localizeTheme(t: Theme, lang: Lang): Theme {
  if (lang === 'fr') return t
  const en = EN_THEMES[t.id]
  return en && same(t.name, seedThemeById.get(t.id)?.name) ? { ...t, name: en } : t
}

export const statueWho = (philosophyId: string, who: string, lang: Lang) => (lang === 'en' ? EN_STATUES[philosophyId] ?? who : who)
export const statueMaterial = (material: string, lang: Lang) => (lang === 'en' ? EN_MATERIALS[material] ?? material : material)
