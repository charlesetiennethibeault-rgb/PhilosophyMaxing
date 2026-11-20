// Cherche sur Wikimedia Commons des photos libres de droits pour chaque entrée de specs.mjs.
// Sortie : scripts/statues/candidates.json (à relire visuellement avant de choisir).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { SPECS } from './specs.mjs'
import { EXTRA } from './specs-extra.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const API = 'https://commons.wikimedia.org/w/api.php'
const UA = 'PhilosophyMaxingResearch/1.0 (recherche de statues libres de droits)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Licences acceptées : libres, avec ou sans attribution (jamais NC ni ND).
const OK_LICENSE = /^(CC0|CC BY(-SA)? [0-9.]+|Public domain|PD[- ]|Attribution|CC BY(-SA)?$|GFDL|Copyrighted free use)/i
const BAD_TITLE = /inscri|plaque|foundation|signboard|painting|drawing|engraving|stamp|coin|poster|logo|map|diagram|cover|book|portrait of|lithograph|caricature|grave|tomb of/i
const GOOD_TITLE = /statue|bust|büste|buste|sculpture|monument|marble|herm|head|relief|figure|memorial/i

const strip = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()

async function api(params, tries = 7) {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`
  for (let i = 0; i < tries; i++) {
    let res
    try { res = await fetch(url, { headers: { 'User-Agent': UA } }) } catch { res = null }
    if (res?.ok) return res.json()
    const wait = Number(res?.headers.get('retry-after')) * 1000 || Math.min(60000, 4000 * 2 ** i)
    await sleep(wait)
  }
  throw new Error(`Commons indisponible : ${params.gsrsearch ?? params.gcmtitle}`)
}

async function searchCommons(q) {
  const inCategory = q.startsWith('cat:')
  const data = await api({
    action: 'query',
    ...(inCategory
      ? { generator: 'categorymembers', gcmtitle: `Category:${q.slice(4)}`, gcmnamespace: '6', gcmlimit: '20', gcmtype: 'file' }
      : { generator: 'search', gsrnamespace: '6', gsrlimit: '14', gsrsearch: `${q} filetype:bitmap` }),
    prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '420',
    iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription|ObjectName|Credit',
  })
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0) || a.title.localeCompare(b.title))
  return pages.map((p) => {
    const ii = p.imageinfo?.[0]
    if (!ii) return null
    const m = ii.extmetadata ?? {}
    return {
      title: p.title,
      page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
      thumb: ii.thumburl, url: ii.url, width: ii.width, height: ii.height, mime: ii.mime,
      license: m.LicenseShortName?.value ?? '',
      artist: strip(m.Artist?.value ?? ''),
      description: strip(m.ImageDescription?.value ?? m.ObjectName?.value ?? '').slice(0, 220),
    }
  }).filter(Boolean)
}

const file = join(here, 'candidates.json')
const done = existsSync(file) && !process.argv.includes('--force') ? JSON.parse(readFileSync(file, 'utf8')) : []
const byId = new Map(done.filter((d) => d.candidates.length > 0).map((d) => [d.id, d]))
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean)
for (const id of only) byId.delete(id)
const out = []
for (const [id, symbolic, baseQueries] of SPECS) {
  const queries = only.includes(id) ? EXTRA[id] ?? baseQueries : baseQueries
  if (byId.has(id)) { out.push(byId.get(id)); console.log(`${String(out.length).padStart(2)} ${id} : déjà trouvé (${byId.get(id).candidates.length})`); continue }
  const seen = new Set()
  const candidates = []
  for (const [q, who, must] of queries) {
    let results = []
    try { results = await searchCommons(q) } catch (e) { console.warn('  échec', q, e.message) }
    const re = new RegExp(must, 'i')
    const kept = results
      .filter((r) => /jpe?g|png/i.test(r.mime) && r.width >= 500 && r.height >= 500)
      .filter((r) => OK_LICENSE.test(r.license))
      .filter((r) => re.test(`${r.title} ${r.description}`))
      .filter((r) => !BAD_TITLE.test(r.title))
      .map((r) => ({ ...r, who, query: q, score: (GOOD_TITLE.test(r.title) ? 2 : 0) + (GOOD_TITLE.test(r.description) ? 1 : 0) }))
      .sort((a, b) => b.score - a.score)
    for (const r of kept) {
      if (seen.has(r.title) || candidates.filter((c) => c.who === who).length >= 4) continue
      seen.add(r.title); candidates.push(r)
    }
    await sleep(1500)
  }
  out.push({ id, symbolic, candidates })
  writeFileSync(file, JSON.stringify([...out, ...SPECS.slice(out.length).map(([i, sy]) => ({ id: i, symbolic: sy, candidates: [] }))], null, 2))
  console.log(`${String(out.length).padStart(2)} ${id} : ${candidates.length} candidat(s)${candidates.length ? '' : '  ← aucun'}`)
}
writeFileSync(file, JSON.stringify(out, null, 2))
console.log('Écrit : scripts/statues/candidates.json')
