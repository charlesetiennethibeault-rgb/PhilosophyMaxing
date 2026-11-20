// Génère seed/topic-overrides.json : sujets communs masqués par philosophie.
// R = retiré (peu pertinent ou trop mince) ; fusion = le sujet absorbé est masqué, l'autre couvre les deux.
// Les notes déjà écrites ne sont jamais supprimées : elles restent en base, cachées.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const seed = join(dirname(fileURLToPath(import.meta.url)), '..', 'seed')
const topics = JSON.parse(readFileSync(join(seed, 'topics.json'), 'utf8'))
const phils = new Set(JSON.parse(readFileSync(join(seed, 'philosophies.json'), 'utf8')).map((p) => p.id))
const byShort = Object.fromEntries(topics.map((t) => [t.short, t.id]))

const hide = {
  'presocratiques': 'Effort Corps',
  'sophistes': 'Mort Temps Corps',
  'cynisme': 'Temps Réalité',
  'hedonisme-cyrenaique': 'Temps Nature',
  'pyrrhonisme-scepticisme': 'Amour Effort',
  'neoplatonisme': 'Effort Société',
  'madhyamaka-nagarjuna': 'Corps Amour Effort',
  'vedanta-advaita': 'Société Effort',
  'jainisme': 'Amour',
  'charvaka-materialisme-indien': 'Temps Effort Société',
  'samkhya-et-yoga': 'Société Amour',
  'nyaya-vaisesika': 'Amour Corps Effort Société',
  'yogacara': 'Société Effort',
  'ajivika-fatalisme': 'Réalité Amour Société Corps | Libre',
  'pensee-indienne-moderne-gandhi-tagore-ambedkar': 'Temps Réalité',
  'confucianisme': 'Réalité',
  'mohisme': 'Soi Temps',
  'legisme': 'Mort Temps Sens Soi Dieu Réalité Corps Amour Nature',
  'zen': 'Société Amour',
  'mencius': 'Temps Réalité',
  'xunzi': 'Amour Réalité',
  'wang-yangming': 'Dieu Corps',
  'ecole-de-kyoto': 'Corps Effort Amour',
  'bushido': 'Temps Réalité Dieu Amour Libre Nature',
  'bouddhisme-engage': 'Temps Réalité Libre',
  'kapwa-philippines': 'Mort Temps Réalité Dieu Libre Nature Corps Effort',
  'philosophie-islamique-classique-et-soufisme': 'Effort',
  'sagesse-juive-maimonide-ecclesiaste': 'Réalité',
  'gnosticisme': 'Effort Société',
  'ibn-khaldun': 'Soi Réalité Corps Amour Sens',
  'illuminationisme-persan': 'Société Effort',
  'mu-tazilisme': 'Corps Amour Effort',
  'ubuntu': 'Réalité Libre',
  'philosophie-akan': 'Soi',
  'philosophie-yoruba-ifa-ori': 'Libre',
  'maat-egypte-ancienne': 'Réalité Libre',
  'zera-yacob-ethiopie': 'Temps Corps Effort',
  'negritude-et-panafricanisme': 'Mort Temps Dieu Libre Réalité',
  'visions-du-monde-autochtones-d-amerique-du-nord': 'Dieu Libre Effort',
  'philosophie-nahua-azteque': 'Amour Effort',
  'philosophies-andines-buen-vivir': 'Dieu Nature Libre Réalité',
  'pensee-inuite': 'Réalité Libre Amour Corps',
  'philosophie-de-la-liberation-et-pensee-decoloniale': 'Mort Temps Corps',
  'temps-du-reve-aborigene': 'Nature Libre Effort',
  'vision-maorie-whakapapa': 'Libre Effort',
  'humanisme-de-la-renaissance': 'Temps',
  'realisme-politique-machiavel-hobbes': 'Temps Corps Amour Sens',
  'rationalisme': 'Effort Société',
  'empirisme': 'Mort Corps Effort',
  'lumieres': 'Temps Réalité',
  'kantisme': 'Corps Amour Effort',
  'utilitarisme': 'Réalité Temps',
  'liberalisme-politique-locke-rawls': 'Mort Temps Réalité Corps Nature',
  'idealisme-allemand-hegel': 'Corps',
  'romantisme': 'Réalité Effort',
  'pessimisme-de-schopenhauer': 'Société Effort',
  'kierkegaard': 'Société Nature Corps',
  'marxisme': 'Mort Corps',
  'pragmatisme': 'Mort Corps Amour',
  'bergson-et-philosophie-du-processus': 'Effort',
  'phenomenologie': 'Dieu Effort Société',
  'existentialisme': 'Nature',
  'absurdisme': 'Temps',
  'philosophie-analytique-wittgenstein': 'Mort Corps Amour Nature Effort Société',
  'structuralisme-et-postmodernisme': 'Mort Dieu',
  'psychanalyse-freud-jung': 'Réalité Effort',
  'ethique-de-l-alterite-levinas-buber': 'Nature Effort Réalité',
  'anarchisme': 'Mort Temps Réalité',
  'feminisme-et-ethique-du-care': 'Mort Temps Réalité',
  'ecologie-profonde': 'Temps Réalité',
  'altruisme-efficace': 'Mort Temps Réalité Dieu Corps Amour Nature',
  'wabi-sabi': 'Mort Libre Réalité Société NatHum Amour',
  'minimalisme': 'Mort Temps Réalité Dieu Libre Corps Amour NatHum',
  'philosophie-de-l-esprit-dualisme-physicalisme-panpsychisme': 'Société Amour Effort Bonheur',
}
const aliases = { Libre: 'Libre arbitre', NatHum: 'Nature humaine' }

const out = {}
for (const [ph, spec] of Object.entries(hide)) {
  if (!phils.has(ph)) throw new Error(`philosophie inconnue : ${ph}`)
  const ids = spec.replace('|', ' ').split(/\s+/).filter(Boolean).map((s) => {
    const short = aliases[s] ?? s
    const id = byShort[short]
    if (!id) throw new Error(`sujet inconnu : ${s}`)
    return id
  })
  out[ph] = [...new Set(ids)]
}
writeFileSync(join(seed, 'topic-overrides.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`${Object.keys(out).length} philosophies, ${Object.values(out).flat().length} sujets masqués`)
