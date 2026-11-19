import { ERAS, emptyFilters } from '../lib/draw'
import { REGIONS } from '../lib/seed'
import { useData } from '../lib/DataContext'
import { glyphFor } from '../lib/ui'
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

export default function FiltersPanel(p: Props) {
  const { families } = useData()
  const { filters: f } = p
  const s = p.settings
  const set = (patch: Partial<Filters>) => p.onFilters({ ...f, ...patch })
  const range = f.yearRange ?? [-600, 2000]

  return (
    <div className="filters">
      <p className="count" aria-live="polite">
        <strong>{p.wheelCount}</strong> philosophie{p.wheelCount > 1 ? 's' : ''} sur la roue
      </p>

      <fieldset>
        <legend>Familles</legend>
        {families.map((fam, i) => (
          <label key={fam.id} className="check">
            <input type="checkbox" checked={f.families.includes(fam.id)} onChange={() => set({ families: toggle(f.families, fam.id) })} />
            <span className="swatch" style={{ background: fam.color }} aria-hidden="true">{glyphFor(i)}</span>
            <span>{fam.name}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Époque</legend>
        {ERAS.map((e) => (
          <label key={e.id} className="check">
            <input type="checkbox" checked={f.eras.includes(e.id as EraId)} onChange={() => set({ eras: toggle(f.eras, e.id as EraId) })} />
            <span>{e.label}</span>
          </label>
        ))}
        <label className="check">
          <input type="checkbox" checked={!!f.yearRange} onChange={(e) => set({ yearRange: e.target.checked ? [-600, 2000] : null })} />
          <span>Curseur d’années (début du courant)</span>
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
      </fieldset>

      <fieldset>
        <legend>Région</legend>
        {REGIONS.map((r) => (
          <label key={r} className="check">
            <input type="checkbox" checked={f.regions.includes(r)} onChange={() => set({ regions: toggle(f.regions, r) })} />
            <span>{r}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Fiches</legend>
        <label className="check">
          <input type="checkbox" checked={f.favoritesOnly} onChange={(e) => set({ favoritesOnly: e.target.checked })} />
          <span>Favoris seulement</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={f.toVerifyOnly} onChange={(e) => set({ toVerifyOnly: e.target.checked })} />
          <span>Seulement celles « à vérifier »</span>
        </label>
        <button type="button" className="link" onClick={() => p.onFilters(emptyFilters)}>Effacer les filtres</button>
      </fieldset>

      {s && p.onSettings && p.onResetHistory && (
      <fieldset>
        <legend>Tirage</legend>
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
          <span>Mode découverte (favorise ce que j’ai le moins creusé)</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={s.sound} onChange={(e) => p.onSettings?.({ sound: e.target.checked })} />
          <span>Son de la roue</span>
        </label>
        <button
          type="button" className="btn small"
          disabled={!p.historyCount}
          onClick={() => { if (window.confirm('Réinitialiser tout l’historique des tirages ? Tes notes ne sont pas touchées.')) p.onResetHistory?.() }}
        >
          Réinitialiser l’historique des tirages ({p.historyCount})
        </button>
      </fieldset>
      )}
    </div>
  )
}
