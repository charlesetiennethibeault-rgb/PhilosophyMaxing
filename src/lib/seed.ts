import familiesJson from '../../seed/families.json'
import themesJson from '../../seed/themes.json'
import topicsJson from '../../seed/topics.json'
import philosophiesJson from '../../seed/philosophies.json'
import ownTopicsJson from '../../seed/own-topics.json'
import overridesJson from '../../seed/topic-overrides.json'
import type { Family, Philosophy, Theme, Topic } from './types'

export const families = familiesJson as Family[]
export const themes = themesJson as Theme[]
export const philosophies: Philosophy[] = (philosophiesJson as unknown as Omit<Philosophy, 'synthesis' | 'opinion' | 'context'>[])
  .map((p) => ({ ...p, synthesis: '', opinion: '', context: '' }))
export const commonTopics = topicsJson as Topic[]
export const ownTopics = ownTopicsJson as Topic[]
/** Sujets communs masqués par philosophie (peu pertinents ou fusionnés). Les notes existantes restent en base. */
export const hiddenTopics = overridesJson as Record<string, string[]>
export const allTopics: Topic[] = [...commonTopics, ...ownTopics]

export const REGIONS = [
  'Europe', 'Asie du Sud', "Asie de l'Est", 'Asie du Sud-Est',
  'Moyen-Orient et Asie centrale', 'Afrique', 'Amériques', 'Océanie',
]
