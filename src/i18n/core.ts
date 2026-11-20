/**
 * Langue de l'interface : français (par défaut) ou anglais.
 * Le choix est gardé sur l'appareil (localStorage), jamais dans Supabase : aucune donnée n'est touchée.
 */
export type Lang = 'fr' | 'en'
export const LANGS: Lang[] = ['fr', 'en']

const KEY = 'pm.lang'

function readStored(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'fr' || v === 'en') return v
  } catch { /* stockage indisponible */ }
  return 'fr'
}

let current: Lang = typeof localStorage === 'undefined' ? 'fr' : readStored()

export const getLang = (): Lang => current

export function storeLang(lang: Lang) {
  current = lang
  try { localStorage.setItem(KEY, lang) } catch { /* stockage indisponible */ }
}

/** Texte d'un message : une chaîne, ou deux formes (singulier / pluriel) choisies d'après `count`. */
export type Txt = string | { one: string; other: string }
export interface Msg { fr: Txt; en: Txt }
export type Vars = Record<string, string | number>

/**
 * Typographie française (design.md §11) : espace insécable avant « : ; ? ! » et à l'intérieur des « guillemets ».
 * Appliquée au modèle de phrase, avant d'y insérer des valeurs.
 */
export const frTypo = (s: string) => s.replace(/ +([:;?!»])/g, ' $1').replace(/« +/g, '« ')

const pick = (txt: Txt, lang: Lang, count?: number): string => {
  if (typeof txt === 'string') return txt
  const form = count === undefined ? 'other' : new Intl.PluralRules(lang).select(count)
  return form === 'one' ? txt.one : txt.other
}

/** Résout un message dans une langue donnée, sans React. */
export function resolve(msg: Msg, lang: Lang, vars?: Vars): string {
  let s = pick(msg[lang], lang, typeof vars?.count === 'number' ? vars.count : undefined)
  if (lang === 'fr') s = frTypo(s)
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

export const locale = (lang: Lang = current) => (lang === 'en' ? 'en-CA' : 'fr-CA')
