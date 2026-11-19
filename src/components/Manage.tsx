import { useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Star, Trash2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { href } from '../lib/route'
import { downloadJson, buildBackup, parseBackup, type Backup } from '../lib/backup'
import { useData } from '../lib/DataContext'
import { REGIONS } from '../lib/seed'
import { move, normalize, slugify } from '../lib/tools'
import type { AppState } from '../lib/appState'
import type { Family, Philosophy, Theme, Topic } from '../lib/types'

type Section = 'philosophies' | 'topics' | 'families' | 'themes' | 'backup' | 'account'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'philosophies', label: 'Philosophies' },
  { id: 'topics', label: 'Sujets' },
  { id: 'families', label: 'Familles' },
  { id: 'themes', label: 'Thèmes' },
  { id: 'backup', label: 'Sauvegarde' },
  { id: 'account', label: 'Compte' },
]

function Arrows({ onUp, onDown, name }: { onUp: () => void; onDown: () => void; name: string }) {
  return (
    <span className="arrows">
      <button type="button" className="icon-btn" aria-label={`Monter ${name}`} onClick={onUp}><ChevronUp size={20} aria-hidden="true" /></button>
      <button type="button" className="icon-btn" aria-label={`Descendre ${name}`} onClick={onDown}><ChevronDown size={20} aria-hidden="true" /></button>
    </span>
  )
}

/* ---------- philosophies ---------- */

function PhilosophyForm({ initial, families, onSave, onCancel }: {
  initial: Philosophy; families: Family[]; onSave: (p: Philosophy) => void; onCancel: () => void
}) {
  const [p, setP] = useState(initial)
  const [actors, setActors] = useState(initial.actors.join(', '))
  const set = (patch: Partial<Philosophy>) => setP((x) => ({ ...x, ...patch }))
  return (
    <form className="mform" onSubmit={(e) => {
      e.preventDefault()
      onSave({ ...p, name: p.name.trim(), actors: actors.split(',').map((a) => a.trim()).filter(Boolean) })
    }}>
      <label>Nom<input required value={p.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <label>Famille
        <select value={p.family} onChange={(e) => set({ family: e.target.value })}>
          {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </label>
      <label>Région
        <select value={p.region} onChange={(e) => set({ region: e.target.value })}>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label>Année de début (négative avant J.-C.)<input type="number" required value={p.startYear} onChange={(e) => set({ startYear: Number(e.target.value) })} /></label>
      <label>Année de fin (si le courant est clos)<input type="number" value={p.endYear ?? ''} onChange={(e) => set({ endYear: e.target.value === '' ? null : Number(e.target.value) })} /></label>
      <label>Libellé de dates<input value={p.dateLabel} placeholder="vers 300 av. J.-C." onChange={(e) => set({ dateLabel: e.target.value })} /></label>
      <label>Fondateur ou origine<input value={p.founder} onChange={(e) => set({ founder: e.target.value })} /></label>
      <label>Principaux acteurs (séparés par des virgules)<input value={actors} onChange={(e) => setActors(e.target.value)} /></label>
      <label>Description (une phrase)<textarea rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} /></label>
      <div className="mform-actions">
        <button type="submit" className="btn btn-primary">Enregistrer</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  )
}

function PhilosophiesSection({ st }: { st: AppState }) {
  const { families, family } = useData()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Philosophy | null>(null)
  const sorted = useMemo(() => [...st.philosophies].sort((a, b) => a.order - b.order), [st.philosophies])
  const shown = sorted.filter((p) => !q || normalize(p.name).includes(normalize(q)))

  const blank = (): Philosophy => ({
    id: '', name: '', family: families[0]?.id ?? '', region: REGIONS[0], startYear: 2000, endYear: null, dateLabel: '',
    founder: '', actors: [], description: '', aVerifier: false, reserve: false, favorite: false, tags: [], synthesis: '', opinion: '', context: '',
    order: Math.max(0, ...st.philosophies.map((p) => p.order)) + 1,
  })

  if (editing) {
    return (
      <PhilosophyForm
        initial={editing} families={families} onCancel={() => setEditing(null)}
        onSave={(p) => {
          st.savePhilosophy(p.id ? p : { ...p, id: slugify(p.name, st.philosophies.map((x) => x.id)) })
          setEditing(null)
        }}
      />
    )
  }
  return (
    <section>
      <div className="manage-bar">
        <input type="search" aria-label="Filtrer les philosophies" placeholder="Filtrer par nom…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="btn btn-primary" onClick={() => setEditing(blank())}><Plus size={16} aria-hidden="true" />Ajouter une philosophie</button>
      </div>
      <ul className="mlist">
        {shown.map((p) => (
          <li key={p.id}>
            <span className="swatch" style={{ background: family(p.family).color }} aria-hidden="true" />
            <span className="mname">{p.name}</span>
            <Arrows name={p.name} onUp={() => st.reorder('philosophies', move(sorted, p.id, -1))} onDown={() => st.reorder('philosophies', move(sorted, p.id, 1))} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(p)}><Pencil size={16} aria-hidden="true" />Modifier</button>
            <button
              type="button" className="btn btn-danger btn-sm"
              onClick={() => { if (window.confirm(`Supprimer « ${p.name} » ? Ses sujets propres, ses notes et ses synthèses seront supprimés aussi. Cette action est définitive.`)) st.deletePhilosophy(p.id) }}
            ><Trash2 size={16} aria-hidden="true" />Supprimer</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- sujets ---------- */

function TopicForm({ initial, st, onSave, onCancel }: { initial: Topic; st: AppState; onSave: (t: Topic) => void; onCancel: () => void }) {
  const { themes } = useData()
  const isNew = !initial.id
  const [t, setT] = useState(initial)
  const set = (patch: Partial<Topic>) => setT((x) => ({ ...x, ...patch }))
  return (
    <form className="mform" onSubmit={(e) => { e.preventDefault(); onSave({ ...t, name: t.name.trim(), short: (t.short || t.name).trim() }) }}>
      <label>Nom du sujet<input required value={t.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <label>Nom court (sur la roue)<input value={t.short} maxLength={26} onChange={(e) => set({ short: e.target.value })} /></label>
      <label>Question de recherche<input value={t.question} placeholder="Que dit [philosophie] de … ?" onChange={(e) => set({ question: e.target.value })} /></label>
      {isNew && (
        <fieldset className="seg-fieldset">
          <legend>Portée</legend>
          <div className="seg-group">
          <label className={`seg${t.scope === 'common' ? ' on' : ''}`}><input type="radio" name="tscope" checked={t.scope === 'common'} onChange={() => set({ scope: 'common', philosophy: undefined, theme: themes[0]?.id })} />Global (rejoint la roue commune)</label>
          <label className={`seg${t.scope === 'own' ? ' on' : ''}`}><input type="radio" name="tscope" checked={t.scope === 'own'} onChange={() => set({ scope: 'own', theme: undefined, philosophy: st.philosophies[0]?.id })} />Propre à une philosophie</label>
          </div>
        </fieldset>
      )}
      {t.scope === 'common' ? (
        <label>Thème
          <select value={t.theme ?? ''} onChange={(e) => set({ theme: e.target.value })}>
            {themes.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
          </select>
        </label>
      ) : (
        isNew && (
          <label>Philosophie
            <select value={t.philosophy ?? ''} onChange={(e) => set({ philosophy: e.target.value })}>
              {st.philosophies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        )
      )}
      <div className="mform-actions">
        <button type="submit" className="btn btn-primary">Enregistrer</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  )
}

function TopicsSection({ st }: { st: AppState }) {
  const { themes } = useData()
  const [editing, setEditing] = useState<Topic | null>(null)
  const [ownFor, setOwnFor] = useState(st.philosophies[0]?.id ?? '')
  const common = st.topics.filter((t) => t.scope === 'common').sort((a, b) => a.order - b.order)
  const own = st.topics.filter((t) => t.scope === 'own' && t.philosophy === ownFor).sort((a, b) => a.order - b.order)
  const themeName = (id?: string) => themes.find((t) => t.id === id)?.name ?? '—'

  if (editing) {
    return (
      <TopicForm
        initial={editing} st={st} onCancel={() => setEditing(null)}
        onSave={(t) => {
          const scopeList = st.topics.filter((x) => x.scope === t.scope && (t.scope === 'common' || x.philosophy === t.philosophy))
          const id = t.id || (t.scope === 'own' ? `${t.philosophy}--${slugify(t.name, [])}` : slugify(t.name, []))
          const unique = t.id ? id : (st.topics.some((x) => x.id === id) ? `${id}-${Date.now().toString(36)}` : id)
          st.saveTopic({
            ...t, id: unique, aVerifier: t.id ? t.aVerifier : false,
            order: t.id ? t.order : Math.max(0, ...scopeList.map((x) => x.order)) + 1,
            question: t.question || (t.scope === 'common' ? `Que dit [philosophie] de ${t.name.toLowerCase()} ?` : `Que dit ${st.philosophies.find((p) => p.id === t.philosophy)?.name ?? ''} de « ${t.name} » ?`),
          })
          setEditing(null)
        }}
      />
    )
  }

  const blank = (scope: 'common' | 'own'): Topic => ({
    id: '', name: '', short: '', scope, theme: scope === 'common' ? themes[0]?.id : undefined,
    philosophy: scope === 'own' ? ownFor : undefined, active: true, question: '', order: 0,
  })

  const row = (t: Topic, list: Topic[]) => (
    <li key={t.id}>
      {t.scope === 'common' && (
        <label className="switch" title="Activer ou désactiver ce sujet pour toutes les philosophies">
          <input type="checkbox" checked={t.active} onChange={(e) => st.setTopicActive(t.id, e.target.checked)} aria-label={`Sujet ${t.name} actif`} />
        </label>
      )}
      <span className="mname">{t.scope === 'own' && <Star size={16} aria-hidden="true" fill="currentColor" />}{t.name}{t.scope === 'common' && <span className="plist-sub"> · {themeName(t.theme)}</span>}</span>
      <Arrows name={t.name} onUp={() => st.reorder('topics', move(list, t.id, -1))} onDown={() => st.reorder('topics', move(list, t.id, 1))} />
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(t)}><Pencil size={16} aria-hidden="true" />Modifier</button>
      <button
        type="button" className="btn btn-danger btn-sm"
        onClick={() => { if (window.confirm(`Supprimer le sujet « ${t.name} » ? Les notes liées seront supprimées aussi.`)) st.deleteTopic(t.id) }}
      ><Trash2 size={16} aria-hidden="true" />Supprimer</button>
    </li>
  )

  return (
    <section>
      <h3>Sujets communs</h3>
      <p className="hint">L’interrupteur retire un sujet de la roue pour toutes les philosophies, sans le supprimer.</p>
      <ul className="mlist">{common.map((t) => row(t, common))}</ul>
      <button type="button" className="btn btn-secondary" onClick={() => setEditing(blank('common'))}>Ajouter un sujet global</button>

      <h3>Sujets propres</h3>
      <label className="inline-select">Philosophie
        <select value={ownFor} onChange={(e) => setOwnFor(e.target.value)}>
          {[...st.philosophies].sort((a, b) => a.order - b.order).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <ul className="mlist">
        {own.map((t) => row(t, own))}
        {own.length === 0 && <li className="md-empty">Aucun sujet propre pour cette philosophie.</li>}
      </ul>
      <button type="button" className="btn btn-secondary" onClick={() => setEditing(blank('own'))}>Ajouter un sujet propre</button>
    </section>
  )
}

/* ---------- familles et thèmes ---------- */

function NamedList<T extends { id: string; name: string; order: number }>({ items, noun, used, color, onSave, onDelete, onReorder, make }: {
  items: T[]; noun: string; used: (id: string) => number; color?: boolean
  onSave: (item: T) => void; onDelete: (id: string) => void; onReorder: (list: T[]) => void; make: (name: string, order: number) => T
}) {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const [name, setName] = useState('')
  return (
    <section>
      <ul className="mlist">
        {sorted.map((it) => {
          const n = used(it.id)
          return (
            <li key={it.id}>
              {color && <input type="color" aria-label={`Couleur de ${it.name}`} value={(it as unknown as Family).color} onChange={(e) => onSave({ ...it, color: e.target.value } as T)} />}
              <input className="mname-input" aria-label={`Nom : ${it.name}`} defaultValue={it.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== it.name) onSave({ ...it, name: v }) }} />
              <span className="plist-sub">{n} utilisée{n > 1 ? 's' : ''}</span>
              <Arrows name={it.name} onUp={() => onReorder(move(sorted, it.id, -1) as T[])} onDown={() => onReorder(move(sorted, it.id, 1) as T[])} />
              <button
                type="button" className="btn btn-danger btn-sm" disabled={n > 0}
                title={n > 0 ? `Impossible : encore utilisée. Déplace ou supprime d’abord ce qui l’utilise.` : undefined}
                onClick={() => { if (window.confirm(`Supprimer « ${it.name} » ?`)) onDelete(it.id) }}
              ><Trash2 size={16} aria-hidden="true" />Supprimer</button>
            </li>
          )
        })}
      </ul>
      <form className="manage-bar" onSubmit={(e) => { e.preventDefault(); const v = name.trim(); if (v) { onSave(make(v, Math.max(0, ...items.map((i) => i.order)) + 1)); setName('') } }}>
        <input aria-label={`Nom de la nouvelle ${noun}`} placeholder={`Nouvelle ${noun}…`} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn btn-primary">Ajouter</button>
      </form>
    </section>
  )
}

/* ---------- sauvegarde ---------- */

function BackupSection({ st }: { st: AppState }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File | undefined) => {
    setMsg(null); setPending(null)
    if (!file) return
    const r = parseBackup(await file.text())
    if (r.ok) setPending(r.backup)
    else setMsg({ kind: 'error', text: r.error })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <section>
      <h3>Exporter</h3>
      <p>Télécharge toutes tes données (philosophies, sujets, notes, synthèses, historique, réglages) dans un fichier JSON de secours.</p>
      <button
        type="button" className="btn btn-primary"
        onClick={() => downloadJson(`philosophymaxing-${new Date().toISOString().slice(0, 10)}.json`, buildBackup(st.exportData()))}
      >Exporter mes données (JSON)</button>

      <h3>Importer</h3>
      <p>Choisis un fichier exporté depuis PhilosophyMaxing. Les éléments de même identifiant sont mis à jour ; rien n’est supprimé.</p>
      <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Fichier de sauvegarde" onChange={(e) => void onFile(e.target.files?.[0])} />
      {pending && (
        <div className="message" role="alert">
          <p>
            Cette sauvegarde contient {pending.philosophies.length} philosophies, {pending.topics.length} sujets, {pending.notes.length} notes
            et {pending.syntheses.length} synthèses (exportée le {new Date(pending.exportedAt).toLocaleDateString('fr-CA')}).
            Les éléments existants de même identifiant seront écrasés par ceux du fichier.
          </p>
          <button
            type="button" className="btn btn-primary" disabled={busy}
            onClick={async () => {
              setBusy(true)
              try { await st.importData(pending); setMsg({ kind: 'ok', text: 'Import terminé.' }); setPending(null) }
              catch (e) { setMsg({ kind: 'error', text: `Import impossible : ${e instanceof Error ? e.message : e}` }) }
              finally { setBusy(false) }
            }}
          >{busy ? 'Import…' : 'Importer et remplacer'}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPending(null)}>Annuler</button>
        </div>
      )}
      {msg && <p className={msg.kind === 'error' ? 'error' : 'notice'} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
    </section>
  )
}

const MIN_PASSWORD = 8

function AccountSection({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (pw.length < MIN_PASSWORD) return setMsg({ kind: 'error', text: `Le code secret doit faire au moins ${MIN_PASSWORD} caractères.` })
    if (pw !== pw2) return setMsg({ kind: 'error', text: 'Les deux codes secrets ne sont pas identiques.' })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) setMsg({ kind: 'error', text: `Impossible de définir le code secret : ${error.message}` })
    else { setMsg({ kind: 'ok', text: 'Code secret enregistré. Tu pourras entrer avec lui sur tous tes appareils.' }); setPw(''); setPw2('') }
  }

  return (
    <section>
      <h3>Code secret</h3>
      <p>Connecté en tant que <strong>{email}</strong>. Définis un code secret pour entrer sans recevoir de courriel. Il remplace l’ancien s’il y en avait un.</p>
      <form className="mform" onSubmit={submit}>
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        <label>Nouveau code secret<input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <label>Confirmer le code secret<input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
        <p className="hint">Au moins {MIN_PASSWORD} caractères. Comme le site est public, évite un mot simple à deviner : une phrase courte fonctionne bien.</p>
        <div className="mform-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le code secret'}</button>
        </div>
      </form>
      {msg && <p className={msg.kind === 'error' ? 'error' : 'notice'} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
      <h3>Session</h3>
      <button type="button" className="btn btn-secondary" onClick={onSignOut}>Me déconnecter</button>
    </section>
  )
}

export default function Manage({ st, email, onSignOut, section: sectionParam }: { st: AppState; email: string; onSignOut: () => void; section?: string }) {
  const section: Section = SECTIONS.find((x) => x.id === sectionParam)?.id ?? 'philosophies'
  const { families, themes } = useData()
  return (
    <div className="manage">
      <nav className="tabs subtabs" aria-label="Éléments à gérer">
        {SECTIONS.map((x) => (
          <a key={x.id} href={href(['carnet', 'gerer', x.id])} aria-current={section === x.id ? 'page' : undefined}>{x.label}</a>
        ))}
      </nav>
      {section === 'philosophies' && <PhilosophiesSection st={st} />}
      {section === 'topics' && <TopicsSection st={st} />}
      {section === 'families' && (
        <NamedList<Family>
          items={families} noun="famille" color used={(id) => st.philosophies.filter((p) => p.family === id).length}
          onSave={st.saveFamily} onDelete={st.deleteFamily} onReorder={(l) => st.reorder('families', l)}
          make={(name, order) => ({ id: slugify(name, families.map((f) => f.id)), name, color: '#7a6a55', order })}
        />
      )}
      {section === 'themes' && (
        <NamedList<Theme>
          items={themes} noun="thème" used={(id) => st.topics.filter((t) => t.theme === id).length}
          onSave={st.saveTheme} onDelete={st.deleteTheme} onReorder={(l) => st.reorder('themes', l)}
          make={(name, order) => ({ id: slugify(name, themes.map((t) => t.id)), name, order })}
        />
      )}
      {section === 'backup' && <BackupSection st={st} />}
      {section === 'account' && <AccountSection email={email} onSignOut={onSignOut} />}
    </div>
  )
}
