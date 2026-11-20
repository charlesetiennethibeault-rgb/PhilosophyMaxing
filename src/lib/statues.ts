import statuesJson from '../../seed/statues.json'
import { getLang, t } from '../i18n'
import { statueMaterial, statueWho } from '../i18n/content'

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

/** Qui est représenté, dans la langue de l'interface (le français d'origine est dans seed/statues.json). */
const whoOf = (s: Statue): string => statueWho(s.philosophy, s.who, getLang())

/** Nom court de la personne représentée : « Ptahhotep, auteur de… » → « Ptahhotep ». */
export const statueName = (s: Statue): string => whoOf(s).split(/,| \(/)[0].trim()

/** Matière visible, dans la langue de l'interface. */
export const statueMaterialLabel = (s: Statue): string => statueMaterial(s.material, getLang())

/** Texte alternatif de l'image (pour les lecteurs d'écran, pas affiché). */
export function statueCaption(s: Statue): string {
  if (s.symbolic) return t('statue.symbolic', { who: whoOf(s) })
  return t(s.material === 'bronze' ? 'statue.bronzeOf' : 'statue.of', { who: whoOf(s) })
}
