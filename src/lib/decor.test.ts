import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import decor from './decor.json'

const dir = join(__dirname, '..', '..', 'public', 'decor')

describe('décor : carte et colonnes', () => {
  it('les images existent, sont légères et ont un crédit libre avec page Commons', () => {
    for (const f of ['carte-peutinger.jpg', 'pilier-haut.jpg', 'pilier-fut.jpg', 'pilier-pied.jpg']) {
      expect(existsSync(join(dir, f)), f).toBe(true)
      expect(statSync(join(dir, f)).size, f).toBeLessThan(200_000)
    }
    for (const c of [decor.carte, decor.pilier]) {
      expect(c.license).toMatch(/^(CC0|Public domain)/)
      expect(c.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File(:|%3A)/)
    }
  })
})
