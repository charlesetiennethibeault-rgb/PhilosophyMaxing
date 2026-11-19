export type NoteStatus = 'empty' | 'draft' | 'deep'

export interface Family { id: string; name: string; color: string; order: number }
export interface Theme { id: string; name: string; order: number }

export interface Philosophy {
  id: string
  name: string
  family: string
  region: string
  startYear: number
  endYear: number | null
  dateLabel: string
  founder: string
  actors: string[]
  description: string
  aVerifier: boolean
  reserve: boolean
  favorite: boolean
  tags: string[]
  order: number
}

export interface Topic {
  id: string
  name: string
  short: string
  scope: 'common' | 'own'
  theme?: string
  philosophy?: string
  active: boolean
  question: string
  order: number
  aVerifier?: boolean
}

/** Une case = un couple philosophie + sujet. */
export const cellKey = (philosophyId: string, topicId: string) => `${philosophyId}|${topicId}`

export interface Draw {
  type: 'philosophy' | 'topic'
  philosophy: string
  topic?: string
  at: string
}

export type EraId = 'antiquite' | 'moyen-age' | 'moderne' | 'xixe' | 'xxe' | 'xxie'

export interface Filters {
  families: string[] // vide = toutes
  eras: EraId[] // vide = toutes
  yearRange: [number, number] | null
  regions: string[] // vide = toutes
  favoritesOnly: boolean
  toVerifyOnly: boolean
}

export interface DrawSettings {
  noRepeat: boolean // « ne pas retomber sur une case déjà tirée »
  onlyRemaining: boolean // « seulement ce qui reste à faire »
  discovery: boolean
  sound: boolean
}
