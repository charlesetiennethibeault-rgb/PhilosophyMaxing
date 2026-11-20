// Cherche sur Wikimedia Commons des gravures et cartes anciennes du domaine public (décor du site).
// Sortie : scripts/decor/candidates.json, à relire visuellement avant de choisir.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const API = 'https://commons.wikimedia.org/w/api.php'
const UA = 'PhilosophyMaxingResearch/1.0 (recherche de gravures libres de droits)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const OK_LICENSE = /^(CC0|CC BY(-SA)? [0-9.]+|Public domain|PD[- ]|Attribution|CC BY(-SA)?$)/i
const strip = (h = '') => h.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()

async function api(params, tries = 7) {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`
  for (let i = 0; i < tries; i++) {
    let res
    try { res = await fetch(url, { headers: { 'User-Agent': UA } }) } catch { res = null }
    if (res?.ok) return res.json()
    await sleep(Number(res?.headers.get('retry-after')) * 1000 || Math.min(60000, 4000 * 2 ** i))
  }
  throw new Error('Commons indisponible')
}

async function search(q, limit = 12) {
  const cat = q.startsWith('cat:')
  const data = await api({
    action: 'query',
    ...(cat ? { generator: 'categorymembers', gcmtitle: `Category:${q.slice(4)}`, gcmnamespace: '6', gcmlimit: String(limit), gcmtype: 'file' }
            : { generator: 'search', gsrnamespace: '6', gsrlimit: String(limit), gsrsearch: `${q} filetype:bitmap` }),
    prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '420',
    iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription|ObjectName',
  })
  return Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0) || a.title.localeCompare(b.title)).map((p) => {
    const ii = p.imageinfo?.[0]; if (!ii) return null
    const m = ii.extmetadata ?? {}
    return { title: p.title, page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, thumb: ii.thumburl, url: ii.url, width: ii.width, height: ii.height,
      license: m.LicenseShortName?.value ?? '', artist: strip(m.Artist?.value ?? ''), description: strip(m.ImageDescription?.value ?? m.ObjectName?.value ?? '').slice(0, 160) }
  }).filter((c) => c && OK_LICENSE.test(c.license) && c.width >= 900)
}

const QUERIES = [
  ['panthéon', 'Piranesi Veduta del Pantheon d\'Agrippa'],
  ['colisée', 'Piranesi Veduta dell\'Anfiteatro Flavio detto il Colosseo'],
  ['forum', 'Piranesi Veduta del Campo Vaccino'],
  ['castor', 'Piranesi Tempio di Castore e Polluce Campo Vaccino'],
  ['trajan', 'Piranesi Colonna Traiana'],
  ['constantin', 'Piranesi Arco di Costantino'],
  ['titus', 'Piranesi Arco di Tito'],
  ['vespasien', 'Piranesi Tempio di Vespasiano Giove Tonante'],
  ['antonine', 'Piranesi Colonna di Antonino Pio'],
  ['cat-vedute', 'cat:Vedute di Roma by Giovanni Battista Piranesi'],
  ['carte-peutinger', 'Tabula Peutingeriana segment'],
  ['carte-romaine', 'ancient map Roman Empire antique engraved Orbis Romanus'],
  ['parchemin', 'old parchment paper texture'],
  ['carte-ancienne', 'old world map parchment antique 16th century'],
]
const out = []
for (const [id, q] of QUERIES) {
  const c = await search(q, id.startsWith('cat-') ? 40 : 12).catch(() => [])
  console.log(id, c.length)
  out.push({ id, q, candidates: c })
  await sleep(1500)
}
writeFileSync(join(here, 'candidates.json'), JSON.stringify(out, null, 1))
console.log('Écrit : candidates.json')
