import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import decor from './decor.json'

const dir = join(__dirname, '..', '..', 'public', 'decor')

describe('gravures du décor', () => {
  it('chaque gravure existe, est légère et a une licence libre et une page Commons', () => {
    expect(decor.monuments.length).toBeGreaterThanOrEqual(6)
    for (const m of decor.monuments) {
      expect(existsSync(join(dir, m.file)), m.file).toBe(true)
      expect(statSync(join(dir, m.file)).size, m.file).toBeLessThan(200_000)
      expect(m.license).toMatch(/^(CC0|Public domain)/)
      expect(m.page).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File(:|%3A)/)
    }
  })
  it('la carte et les colonnes sont présentes avec leur crédit', () => {
    for (const f of ['carte-peutinger.jpg', 'pilier-haut.jpg', 'pilier-fut.jpg', 'pilier-pied.jpg']) expect(existsSync(join(dir, f)), f).toBe(true)
    expect(decor.carte.license).toMatch(/^(CC0|Public domain)/)
    expect(decor.pilier.license).toMatch(/^(CC0|Public domain)/)
  })
})
