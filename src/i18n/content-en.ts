/** Traductions anglaises du contenu fourni avec l'application. Remplies en phase 2. */

export interface EnPhilosophy {
  name: string
  dateLabel: string
  founder: string
  actors: string[]
  description: string
  /** Comment en parler dans une phrase (« the Stoics »). Par défaut : le nom. */
  ref?: string
  /** Le nom est un pluriel (« the Sophists ») : « What do the Sophists say… ». */
  plural?: boolean
}
export interface EnTopic { name: string; short: string; question: string }

export const EN_PHILOSOPHIES: Record<string, EnPhilosophy> = {}
export const EN_TOPICS: Record<string, EnTopic> = {}
export const EN_FAMILIES: Record<string, string> = {}
export const EN_THEMES: Record<string, string> = {}
/** Qui est représenté sur la statue de chaque philosophie (par identifiant de philosophie). */
export const EN_STATUES: Record<string, string> = {}
export const EN_MATERIALS: Record<string, string> = {}
