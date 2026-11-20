import statuesJson from '../../seed/statues.json'

/**
 * Une statue (ou un buste) pour le créateur de chaque philosophie, affichée dans « Comparer ».
 * Photos libres de droits de Wikimedia Commons, copiées dans public/statues/ avec leur crédit.
 */
export interface Statue {
  /** Identifiant de la philosophie. */
  philosophy: string
  /** Qui est représenté (« Platon », « Ma'ât, déesse égyptienne »…). */
  who: string
  /** Pas de créateur unique : la statue représente la tradition (affiché clairement). */
  symbolic: boolean
  /** Matière visible : pierre, marbre, bronze, bois… */
  material: string
  /** Nom du fichier dans public/statues/. Vide = aucune statue trouvée (socle vide). */
  file: string
  /** Page Commons de la photo. */
  page: string
  /** Auteur de la photo. */
  author: string
  /** Licence (CC0, CC BY-SA 4.0, domaine public…). */
  license: string
}

export const statues = statuesJson as Statue[]

export const statueFor = (philosophyId: string): Statue | undefined => statues.find((s) => s.philosophy === philosophyId)

/** Adresse publique de la photo (tient compte du chemin de base de GitHub Pages). */
export const statueUrl = (file: string) => `${import.meta.env.BASE_URL}statues/${file}`

/** Légende lisible : « Statue de Platon » / « Figure symbolique : … ». */
export function statueCaption(s: Statue): string {
  if (s.symbolic) return `Figure symbolique : ${s.who}`
  return `${s.material === 'bronze' ? 'Statue en bronze' : 'Statue'} de ${s.who}`
}
