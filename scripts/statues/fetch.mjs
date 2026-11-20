// Télécharge les photos choisies (choices.json) depuis Wikimedia Commons et écrit seed/statues.json.
// choices.json : { "<id philosophie>": { "i": numéro du candidat, "material": "pierre", "who": facultatif } }
// Une philosophie absente de choices.json (ou avec "i": null) reçoit un socle vide.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { SPECS } from './specs.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const out = join(root, 'public', 'statues')
const UA = 'PhilosophyMaxingResearch/1.0 (recherche de statues libres de droits)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync(out, { recursive: true })

const cands = JSON.parse(readFileSync(join(here, 'candidates.json'), 'utf8'))
const choices = JSON.parse(readFileSync(join(here, 'choices.json'), 'utf8'))
const frNames = JSON.parse(readFileSync(join(root, 'seed', 'philosophies.json'), 'utf8'))

async function download(title) {
  const name = title.replace(/^File:/, '')
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=640`
  for (let i = 0; i < 7; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' }).catch(() => null)
    if (res?.ok && /^image\/(jpeg|png|webp)/.test(res.headers.get('content-type') ?? '')) {
      return { buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') }
    }
    await sleep(Number(res?.headers.get('retry-after')) * 1000 || Math.min(60000, 4000 * 2 ** i))
  }
  throw new Error(`téléchargement impossible : ${title}`)
}

const result = []
for (const [id, symbolic] of SPECS) {
  const choice = choices[id]
  const entry = cands.find((c) => c.id === id)
  const c = choice && choice.i != null ? entry?.candidates[choice.i] : null
  if (!c) {
    result.push({ philosophy: id, who: choice?.who ?? '', symbolic, material: '', file: '', page: '', author: '', license: '' })
    console.log(id, ': socle vide')
    continue
  }
  const ext = /png/.test(c.mime) ? 'png' : 'jpg'
  const file = `${id}.${ext}`
  if (!existsSync(join(out, file))) {
    const { buf } = await download(c.title)
    writeFileSync(join(out, file), buf)
    await sleep(1200)
  }
  result.push({
    philosophy: id, who: choice.who ?? c.who, symbolic: choice.symbolic ?? symbolic, material: choice.material ?? 'pierre', file,
    page: c.page, author: (c.artist || 'auteur inconnu').slice(0, 90), license: c.license,
  })
  console.log(id, ':', file, '·', c.license)
}
writeFileSync(join(root, 'seed', 'statues.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`seed/statues.json : ${result.length} entrées, ${result.filter((r) => r.file).length} photos`)
void frNames
