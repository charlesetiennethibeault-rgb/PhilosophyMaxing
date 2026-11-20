// Télécharge les gravures choisies (domaine public) dans scripts/decor/raw/ (hors git). Usage : node scripts/decor/fetch.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const here = dirname(fileURLToPath(import.meta.url))
const UA = 'PhilosophyMaxingResearch/1.0 (recherche de gravures libres de droits)'
const cands = JSON.parse(readFileSync(join(here, 'candidates.json'), 'utf8'))
const byId = Object.fromEntries(cands.map((c) => [c.id, c.candidates]))
// [id de recherche, index, nom local, largeur demandée]
const PICKS = [
  ['panthéon', 0, 'pantheon', 2600], ['colisée', 6, 'colisee', 2600], ['forum', 5, 'antonin-faustine', 2600], ['forum', 9, 'campo-vaccino', 2600],
  ['constantin', 9, 'constantin', 2600], ['titus', 1, 'titus', 2600], ['trajan', 6, 'trajan', 2600], ['antonine', 0, 'antonine', 3200], ['carte-peutinger', 7, 'peutinger', 6000],
]
mkdirSync(join(here, 'raw'), { recursive: true })
for (const [id, i, name, w] of PICKS) {
  const c = byId[id][i]
  const out = join(here, 'raw', name + '.jpg')
  if (existsSync(out)) continue
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c.title.replace('File:', ''))}?width=${w}`
  for (let t = 0; t < 6; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.ok) { writeFileSync(out, Buffer.from(await r.arrayBuffer())); console.log(name, c.license, c.title); break }
    await new Promise((s) => setTimeout(s, 4000 * 2 ** t))
  }
  await new Promise((s) => setTimeout(s, 1500))
}
