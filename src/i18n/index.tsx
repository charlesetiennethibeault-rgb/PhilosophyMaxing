import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getLang, locale, resolve, storeLang, type Lang, type Vars } from './core'
import { MESSAGES, type MsgKey } from './messages'

export type { Lang } from './core'
export type { MsgKey } from './messages'
export { LANGS, getLang } from './core'

/** Traduit dans la langue courante. Pour le code hors React ; dans un composant, passer par `useLang()`. */
export const t = (key: MsgKey, vars?: Vars): string => resolve(MESSAGES[key], getLang(), vars)

/** Clé dynamique (identifiants venant des données) : renvoie `fallback` si le message n'existe pas. */
export const tOr = (key: string, fallback: string, vars?: Vars): string =>
  key in MESSAGES ? t(key as MsgKey, vars) : fallback

/** Nom d'une région dans la langue courante (les filtres et les données gardent la clé française). */
export const regionLabel = (region: string): string => tOr(`region.${region}`, region)

export type Tags =Record<string, (children: ReactNode) => ReactNode>

/** Comme `t`, mais remplace `<b>…</b>`, `<a>…</a>`… par les éléments fournis. */
export function tRich(key: MsgKey, vars: Vars | undefined, tags: Tags): ReactNode {
  const s = t(key, vars)
  const out: ReactNode[] = []
  const re = /<(\w+)>(.*?)<\/\1>/g
  let last = 0
  let i = 0
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const wrap = tags[m[1]]
    out.push(<Fragment key={i++}>{wrap ? wrap(m[2]) : m[2]}</Fragment>)
    last = m.index + m[0].length
  }
  if (last < s.length) out.push(s.slice(last))
  return out.length === 1 ? out[0] : <>{out}</>
}

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: typeof t
  tRich: typeof tRich
  /** Formats de date et de nombre selon la langue. */
  date: (d: Date | string, opts?: Intl.DateTimeFormatOptions) => string
  number: (n: number) => string
}

const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang)

  const setLang = useCallback((l: Lang) => { storeLang(l); setLangState(l) }, [])

  // Langue du document (lecteurs d'écran, correcteur orthographique) et titre de l'onglet.
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const value = useMemo<Ctx>(() => ({
    lang, setLang, t, tRich,
    date: (d, opts = { dateStyle: 'long' }) => new Intl.DateTimeFormat(locale(lang), opts).format(typeof d === 'string' ? new Date(d) : d),
    number: (n) => n.toLocaleString(locale(lang)),
  }), [lang, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

/** Langue courante et fonctions de traduction ; le composant se redessine quand la langue change. */
export function useLang(): Ctx {
  const c = useContext(LangContext)
  if (!c) throw new Error('useLang doit être utilisé dans <LangProvider>')
  return c
}
