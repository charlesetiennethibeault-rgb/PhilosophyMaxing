import type { ReactNode } from 'react'
import FamilyMark from './FamilyMark'
import { ERAS, emptyFilters } from '../lib/draw'
import { REGIONS } from '../lib/seed'
import { useData } from '../lib/DataContext'
import type { DrawSettings, EraId, Filters } from '../lib/types'

interface Props {
  filters: Filters
  settings?: DrawSettings
  onFilters: (f: Filters) => void
  onSettings?: (s: Partial<DrawSettings>) => void
  onResetHistory?: () => void
  wheelCount: number
  historyCount?: number
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

function Group({ title, count, defaultOpen, children }: { title: string; count?: number; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="fgroup" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {count ? <span className="fcount">{count}</span> : null}
      </summary>
      <div className="fbody">{children}</div>
    </details>
  )
}

export default function FiltersPanel(p: Props) {
  const { families } = useData()
  const { filters: f } = p
  const s = p.settings
  const set = (patch: Partial<Filters>) => p.onFilters({ ...f, ...patch })
  const range = f.yearRange ?? [-600, 2000]
  const active = f.families.length + f.eras.length + f.regions.length + (f.yearRange ? 1 : 0) + (f.favoritesOnly ? 1 : 0) + (f.toVerifyOnly ? 1 : 0)

  return (
    <div className="filters">
      <p className="fsummary" aria-live="polite">
        <span><strong>{p.wheelCount}</strong> philosophie{p.wheelCount > 1 ? 's' : ''} sur la roue</span>
        {active > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => p.onFilters(emptyFilters)}>Effacer les filtres</button>
        )}
      </p>

      <Group title="Familles" count={f.families.length} defaultOpen>
        {families.map((fam, i) => (
          <label key={fam.id} className="check">
            <input type="checkbox" checked={f.families.includes(fam.id)} onChange={() => set({ families: toggle(f.families, fam.id) })} />
            <FamilyMark index={i} color={fam.color} />
            <span>{fam.name}</span>
          </label>
        ))}
      </Group>

      <Group title="Époque" count={f.eras.length + (f.yearRange ? 1 : 0)}>
        {ERAS.map((e) => (
          <label key={e.id} className="check">
            <input type="checkbox" checked={f.eras.includes(e.id as EraId)} onChange={() => set({ eras: toggle(f.eras, e.id as EraId) })} />
            <span>{e.label}</span>
          </label>
        ))}
        <label className="check">
          <input type="checkbox" checked={!!f.yearRange} onChange={(e) => set({ yearRange: e.target.checked ? [-600, 2000] : null })} />
          <span>Choisir une plage d’années</span>
        </label>
        {f.yearRange && (
          <div className="range">
            <label>De <strong>{range[0]}</strong>
              <input type="range" min={-3000} max={2020} step={10} value={range[0]}
                onChange={(e) => set({ yearRange: [Math.min(+e.target.value, range[1]), range[1]] })} />
            </label>
            <label>À <strong>{range[1]}</strong>
              <input type="range" min={-3000} max={2020} step={10} value={range[1]}
                onChange={(e) => set({ yearRange: [range[0], Math.max(+e.target.value, range[0])] })} />
            </label>
          </div>
        )}
      </Group>

      <Group title="Région" count={f.regions.length}>
        {REGIONS.map((r) => (
          <label key={r} className="check">
            <input type="checkbox" checked={f.regions.includes(r)} onChange={() => set({ regions: toggle(f.regions, r) })} />
            <span>{r}</span>
          </label>
        ))}
      </Group>

      <Group title="Fiches" count={(f.favoritesOnly ? 1 : 0) + (f.toVerifyOnly ? 1 : 0)}>
        <label className="check">
          <input type="checkbox" checked={f.favoritesOnly} onChange={(e) => set({ favoritesOnly: e.target.checked })} />
          <span>Favoris seulement</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={f.toVerifyOnly} onChange={(e) => set({ toVerifyOnly: e.target.checked })} />
          <span>Fiches à vérifier seulement</span>
        </label>
      </Group>

      {s && p.onSettings && p.onResetHistory && (
        <Group title="Tirage" defaultOpen>
          <label className="check">
            <input type="checkbox" checked={s.noRepeat} onChange={(e) => p.onSettings?.({ noRepeat: e.target.checked })} />
            <span>Ne pas retomber sur une case déjà tirée</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.onlyRemaining} onChange={(e) => p.onSettings?.({ onlyRemaining: e.target.checked })} />
            <span>Seulement ce qui reste à faire (hors approfondi)</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.discovery} onChange={(e) => p.onSettings?.({ discovery: e.target.checked })} />
            <span>Mode découverte : favoriser ce que j’ai le moins creusé</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.sound} onChange={(e) => p.onSettings?.({ sound: e.target.checked })} />
            <span>Son de la roue</span>
          </label>
          <button
            type="button" className="btn btn-danger btn-sm" disabled={!p.historyCount}
            onClick={() => { if (window.confirm('Réinitialiser tout l’historique des tirages ? Tes notes ne sont pas touchées.')) p.onResetHistory?.() }}
          >Réinitialiser l’historique ({p.historyCount ?? 0})</button>
        </Group>
      )}
    </div>
  )
}
