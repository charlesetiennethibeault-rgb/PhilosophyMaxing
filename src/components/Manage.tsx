import { useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Star, Trash2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { href } from '../lib/route'
import { downloadJson, buildBackup, parseBackup, type Backup } from '../lib/backup'
import { useData } from '../lib/DataContext'
import { LANGS, regionLabel, useLang, type Lang, type MsgKey } from '../i18n'
import { REGIONS } from '../lib/seed'
import { move, normalize, slugify } from '../lib/tools'
import type { AppState } from '../lib/appState'
import type { Family, Philosophy, Theme, Topic } from '../lib/types'

/**
 * `st` : les données telles qu'enregistrées. Tout ce qui se modifie ou s'enregistre part d'elles,
 * pour qu'une traduction affichée ne soit jamais écrite dans la base.
 * `view` : les mêmes données avec les textes traduits, pour les noms qu'on affiche seulement.
 */
type Section = 'philosophies' | 'topics' | 'families' | 'themes' | 'backup' | 'account'
const SECTIONS: { id: Section; label: MsgKey }[] = [
  { id: 'philosophies', label: 'manage.philosophies' },
  { id: 'topics', label: 'manage.topics' },
  { id: 'families', label: 'manage.families' },
  { id: 'themes', label: 'manage.themes' },
  { id: 'backup', label: 'manage.backup' },
  { id: 'account', label: 'manage.account' },
]

function Arrows({ onUp, onDown, name }: { onUp: () => void; onDown: () => void; name: string }) {
  const { t } = useLang()
  return (
    <span className="arrows">
      <button type="button" className="icon-btn" aria-label={t('manage.up', { name })} onClick={onUp}><ChevronUp size={20} aria-hidden="true" /></button>
      <button type="button" className="icon-btn" aria-label={t('manage.down', { name })} onClick={onDown}><ChevronDown size={20} aria-hidden="true" /></button>
    </span>
  )
}

/* ---------- philosophies ---------- */

function PhilosophyForm({ initial, families, onSave, onCancel }: {
  initial: Philosophy; families: Family[]; onSave: (p: Philosophy) => void; onCancel: () => void
}) {
  const { t } = useLang()
  const [p, setP] = useState(initial)
  const [actors, setActors] = useState(initial.actors.join(', '))
  const set = (patch: Partial<Philosophy>) => setP((x) => ({ ...x, ...patch }))
  return (
    <form className="mform" onSubmit={(e) => {
      e.preventDefault()
      onSave({ ...p, name: p.name.trim(), actors: actors.split(',').map((a) => a.trim()).filter(Boolean) })
    }}>
      <label>{t('form.name')}<input required value={p.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <label>{t('form.family')}
        <select value={p.family} onChange={(e) => set({ family: e.target.value })}>
          {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </label>
      <label>{t('form.region')}
        <select value={p.region} onChange={(e) => set({ region: e.target.value })}>
          {REGIONS.map((r) => <option key={r} value={r}>{regionLabel(r)}</option>)}
        </select>
      </label>
      <label>{t('form.startYear')}<input type="number" required value={p.startYear} onChange={(e) => set({ startYear: Number(e.target.value) })} /></label>
      <label>{t('form.endYear')}<input type="number" value={p.endYear ?? ''} onChange={(e) => set({ endYear: e.target.value === '' ? null : Number(e.target.value) })} /></label>
      <label>{t('form.dateLabel')}<input value={p.dateLabel} placeholder={t('form.dateLabelPlaceholder')} onChange={(e) => set({ dateLabel: e.target.value })} /></label>
      <label>{t('form.founder')}<input value={p.founder} onChange={(e) => set({ founder: e.target.value })} /></label>
      <label>{t('form.actors')}<input value={actors} onChange={(e) => setActors(e.target.value)} /></label>
      <label>{t('form.description')}<textarea rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} /></label>
      <div className="mform-actions">
        <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
      </div>
    </form>
  )
}

function PhilosophiesSection({ st, view }: { st: AppState; view: AppState }) {
  const { t } = useLang()
  const { families, family } = useData()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Philosophy | null>(null)
  const sorted = useMemo(() => [...st.philosophies].sort((a, b) => a.order - b.order), [st.philosophies])
  const shownNames = useMemo(() => [...view.philosophies].sort((a, b) => a.order - b.order), [view.philosophies])
  const shown = shownNames.filter((p) => !q || normalize(p.name).includes(normalize(q)))

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
        <input type="search" aria-label={t('mphil.filterAria')} placeholder={t('mphil.filterPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="btn btn-primary" onClick={() => setEditing(blank())}><Plus size={16} aria-hidden="true" />{t('mphil.add')}</button>
      </div>
      <ul className="mlist">
        {shown.map((p) => (
          <li key={p.id}>
            <span className="swatch" style={{ background: family(p.family).color }} aria-hidden="true" />
            <span className="mname">{p.name}</span>
            <Arrows name={p.name} onUp={() => st.reorder('philosophies', move(sorted, p.id, -1))} onDown={() => st.reorder('philosophies', move(sorted, p.id, 1))} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(sorted.find((x) => x.id === p.id) ?? null)}><Pencil size={16} aria-hidden="true" />{t('common.edit')}</button>
            <button
              type="button" className="btn btn-danger btn-sm"
              onClick={() => { if (window.confirm(t('mphil.deleteConfirm', { name: p.name }))) st.deletePhilosophy(p.id) }}
            ><Trash2 size={16} aria-hidden="true" />{t('common.delete')}</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- sujets ---------- */

function TopicForm({ initial, st, view, onSave, onCancel }: { initial: Topic; st: AppState; view: AppState; onSave: (t: Topic) => void; onCancel: () => void }) {
  const { t } = useLang()
  const { themes } = useData()
  const isNew = !initial.id
  const [topic, setTopic] = useState(initial)
  const set = (patch: Partial<Topic>) => setTopic((x) => ({ ...x, ...patch }))
  return (
    <form className="mform" onSubmit={(e) => { e.preventDefault(); onSave({ ...topic, name: topic.name.trim(), short: (topic.short || topic.name).trim() }) }}>
      <label>{t('form.topicName')}<input required value={topic.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <label>{t('form.topicShort')}<input value={topic.short} maxLength={26} onChange={(e) => set({ short: e.target.value })} /></label>
      <label>{t('form.question')}<input value={topic.question} placeholder={t('form.questionPlaceholder')} onChange={(e) => set({ question: e.target.value })} /></label>
      {isNew && (
        <fieldset className="seg-fieldset">
          <legend>{t('form.scope')}</legend>
          <div className="seg-group">
          <label className={`seg${topic.scope === 'common' ? ' on' : ''}`}><input type="radio" name="tscope" checked={topic.scope === 'common'} onChange={() => set({ scope: 'common', philosophy: undefined, theme: themes[0]?.id })} />{t('form.scopeGlobal')}</label>
          <label className={`seg${topic.scope === 'own' ? ' on' : ''}`}><input type="radio" name="tscope" checked={topic.scope === 'own'} onChange={() => set({ scope: 'own', theme: undefined, philosophy: st.philosophies[0]?.id })} />{t('form.scopeOwn')}</label>
          </div>
        </fieldset>
      )}
      {topic.scope === 'common' ? (
        <label>{t('form.theme')}
          <select value={topic.theme ?? ''} onChange={(e) => set({ theme: e.target.value })}>
            {themes.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
          </select>
        </label>
      ) : (
        isNew && (
          <label>{t('form.philosophy')}
            <select value={topic.philosophy ?? ''} onChange={(e) => set({ philosophy: e.target.value })}>
              {view.philosophies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        )
      )}
      <div className="mform-actions">
        <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
      </div>
    </form>
  )
}

function TopicsSection({ st, view }: { st: AppState; view: AppState }) {
  const { t, lang } = useLang()
  const { themes } = useData()
  const [editing, setEditing] = useState<Topic | null>(null)
  const [ownFor, setOwnFor] = useState(st.philosophies[0]?.id ?? '')
  const common = st.topics.filter((x) => x.scope === 'common').sort((a, b) => a.order - b.order)
  const own = st.topics.filter((x) => x.scope === 'own' && x.philosophy === ownFor).sort((a, b) => a.order - b.order)
  const themeName = (id?: string) => themes.find((x) => x.id === id)?.name ?? '—'
  const topicName = (x: Topic) => view.topics.find((v) => v.id === x.id)?.name ?? x.name

  if (editing) {
    return (
      <TopicForm
        initial={editing} st={st} view={view} onCancel={() => setEditing(null)}
        onSave={(x) => {
          const scopeList = st.topics.filter((o) => o.scope === x.scope && (x.scope === 'common' || o.philosophy === x.philosophy))
          const id = x.id || (x.scope === 'own' ? `${x.philosophy}--${slugify(x.name, [])}` : slugify(x.name, []))
          const unique = x.id ? id : (st.topics.some((o) => o.id === id) ? `${id}-${Date.now().toString(36)}` : id)
          // Question par défaut, dans la langue de l'interface. En anglais, « [philosophy] » est remplacé à l'affichage par le nom.
          const owner = st.philosophies.find((p) => p.id === x.philosophy)?.name ?? ''
          const defaultQuestion = x.scope === 'common'
            ? t('form.defaultQuestionCommon', { name: x.name.toLowerCase() })
            : t('form.defaultQuestionOwn', { philosophy: lang === 'en' ? '[philosophy]' : owner, name: x.name })
          st.saveTopic({
            ...x, id: unique, aVerifier: x.id ? x.aVerifier : false,
            order: x.id ? x.order : Math.max(0, ...scopeList.map((o) => o.order)) + 1,
            question: x.question || defaultQuestion,
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

  const row = (x: Topic, list: Topic[]) => (
    <li key={x.id}>
      {x.scope === 'common' && (
        <label className="switch" title={t('mtopic.switchTitle')}>
          <input type="checkbox" checked={x.active} onChange={(e) => st.setTopicActive(x.id, e.target.checked)} aria-label={t('mtopic.activeAria', { name: topicName(x) })} />
        </label>
      )}
      <span className="mname">{x.scope === 'own' && <Star size={16} aria-hidden="true" fill="currentColor" />}{topicName(x)}{x.scope === 'common' && <span className="plist-sub"> · {themeName(x.theme)}</span>}</span>
      <Arrows name={topicName(x)} onUp={() => st.reorder('topics', move(list, x.id, -1))} onDown={() => st.reorder('topics', move(list, x.id, 1))} />
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(x)}><Pencil size={16} aria-hidden="true" />{t('common.edit')}</button>
      <button
        type="button" className="btn btn-danger btn-sm"
        onClick={() => { if (window.confirm(t('mtopic.deleteConfirm', { name: topicName(x) }))) st.deleteTopic(x.id) }}
      ><Trash2 size={16} aria-hidden="true" />{t('common.delete')}</button>
    </li>
  )

  return (
    <section>
      <h3>{t('mtopic.common')}</h3>
      <p className="hint">{t('mtopic.commonHint')}</p>
      <ul className="mlist">{common.map((x) => row(x, common))}</ul>
      <button type="button" className="btn btn-secondary" onClick={() => setEditing(blank('common'))}>{t('mtopic.addGlobal')}</button>

      <h3>{t('mtopic.own')}</h3>
      <label className="inline-select">{t('form.philosophy')}
        <select value={ownFor} onChange={(e) => setOwnFor(e.target.value)}>
          {[...view.philosophies].sort((a, b) => a.order - b.order).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <ul className="mlist">
        {own.map((x) => row(x, own))}
        {own.length === 0 && <li className="md-empty">{t('mtopic.noOwn')}</li>}
      </ul>
      <button type="button" className="btn btn-secondary" onClick={() => setEditing(blank('own'))}>{t('mtopic.addOwn')}</button>
    </section>
  )
}

/* ---------- familles et thèmes ---------- */

/**
 * `items` : les éléments tels qu'enregistrés. `label` : le nom affiché (traduit). Le champ du nom montre le nom affiché
 * et n'enregistre que s'il a été modifié, avec l'élément enregistré : une traduction n'est jamais écrite dans la base.
 */
function NamedList<T extends { id: string; name: string; order: number }>({ items, label, kind, used, color, onSave, onDelete, onReorder, make }: {
  items: T[]; label: (id: string) => string; kind: 'family' | 'theme'; used: (id: string) => number; color?: boolean
  onSave: (item: T) => void; onDelete: (id: string) => void; onReorder: (list: T[]) => void; make: (name: string, order: number) => T
}) {
  const { t } = useLang()
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const [name, setName] = useState('')
  return (
    <section>
      <ul className="mlist">
        {sorted.map((it) => {
          const n = used(it.id)
          const shown = label(it.id)
          return (
            <li key={it.id}>
              {color && <input type="color" aria-label={t('named.colorAria', { name: shown })} value={(it as unknown as Family).color} onChange={(e) => onSave({ ...it, color: e.target.value } as T)} />}
              <input className="mname-input" aria-label={t('named.nameAria', { name: shown })} defaultValue={shown} key={shown} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== shown) onSave({ ...it, name: v }) }} />
              <span className="plist-sub">{t('named.used', { count: n })}</span>
              <Arrows name={shown} onUp={() => onReorder(move(sorted, it.id, -1) as T[])} onDown={() => onReorder(move(sorted, it.id, 1) as T[])} />
              <button
                type="button" className="btn btn-danger btn-sm" disabled={n > 0}
                title={n > 0 ? t('named.inUse') : undefined}
                onClick={() => { if (window.confirm(t('named.deleteConfirm', { name: shown }))) onDelete(it.id) }}
              ><Trash2 size={16} aria-hidden="true" />{t('common.delete')}</button>
            </li>
          )
        })}
      </ul>
      <form className="manage-bar" onSubmit={(e) => { e.preventDefault(); const v = name.trim(); if (v) { onSave(make(v, Math.max(0, ...items.map((i) => i.order)) + 1)); setName('') } }}>
        <input aria-label={t(kind === 'family' ? 'named.family.newAria' : 'named.theme.newAria')} placeholder={t(kind === 'family' ? 'named.family.new' : 'named.theme.new')} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn btn-primary">{t('common.add')}</button>
      </form>
    </section>
  )
}

/* ---------- sauvegarde ---------- */

function BackupSection({ st }: { st: AppState }) {
  const { t, date } = useLang()
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
      <h3>{t('backup.export')}</h3>
      <p>{t('backup.exportText')}</p>
      <button
        type="button" className="btn btn-primary"
        onClick={() => downloadJson(`philosophymaxing-${new Date().toISOString().slice(0, 10)}.json`, buildBackup(st.exportData()))}
      >{t('backup.exportButton')}</button>

      <h3>{t('backup.import')}</h3>
      <p>{t('backup.importText')}</p>
      <input ref={fileRef} type="file" accept="application/json,.json" aria-label={t('backup.fileAria')} onChange={(e) => void onFile(e.target.files?.[0])} />
      {pending && (
        <div className="message" role="alert">
          <p>
            {t('backup.pending', {
              ph: pending.philosophies.length, tp: pending.topics.length, nt: pending.notes.length, sy: pending.syntheses.length,
              date: date(pending.exportedAt, { year: 'numeric', month: 'numeric', day: 'numeric' }),
            })}
          </p>
          <button
            type="button" className="btn btn-primary" disabled={busy}
            onClick={async () => {
              setBusy(true)
              try { await st.importData(pending); setMsg({ kind: 'ok', text: t('backup.done') }); setPending(null) }
              catch (e) { setMsg({ kind: 'error', text: t('backup.failed', { msg: e instanceof Error ? e.message : String(e) }) }) }
              finally { setBusy(false) }
            }}
          >{busy ? t('backup.importing') : t('backup.importReplace')}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPending(null)}>{t('common.cancel')}</button>
        </div>
      )}
      {msg && <p className={msg.kind === 'error' ? 'error' : 'notice'} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
    </section>
  )
}

const MIN_PASSWORD = 8

function AccountSection({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const { t, tRich, lang, setLang } = useLang()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (pw.length < MIN_PASSWORD) return setMsg({ kind: 'error', text: t('account.tooShort', { n: MIN_PASSWORD }) })
    if (pw !== pw2) return setMsg({ kind: 'error', text: t('account.mismatch') })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) setMsg({ kind: 'error', text: t('account.error', { msg: error.message }) })
    else { setMsg({ kind: 'ok', text: t('account.saved') }); setPw(''); setPw2('') }
  }

  return (
    <section>
      <h3>{t('account.language')}</h3>
      <label className="inline-select">{t('lang.label')}
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => <option key={l} value={l} lang={l}>{t(`lang.${l}`)}</option>)}
        </select>
      </label>
      <p className="hint">{t('lang.hint')}</p>

      <h3>{t('account.passcode')}</h3>
      <p>{tRich('account.intro', { email }, { b: (c) => <strong>{c}</strong> })}</p>
      <form className="mform" onSubmit={submit}>
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        <label>{t('account.new')}<input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <label>{t('account.confirm')}<input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
        <p className="hint">{t('account.hint', { n: MIN_PASSWORD })}</p>
        <div className="mform-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('save.saving') : t('account.save')}</button>
        </div>
      </form>
      {msg && <p className={msg.kind === 'error' ? 'error' : 'notice'} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
      <h3>{t('account.session')}</h3>
      <button type="button" className="btn btn-secondary" onClick={onSignOut}>{t('common.signOut')}</button>
    </section>
  )
}

export default function Manage({ st, view, email, onSignOut, section: sectionParam }: { st: AppState; view: AppState; email: string; onSignOut: () => void; section?: string }) {
  const { t } = useLang()
  const section: Section = SECTIONS.find((x) => x.id === sectionParam)?.id ?? 'philosophies'
  const { families, themes } = useData()
  const familyLabel = (id: string) => families.find((f) => f.id === id)?.name ?? id
  const themeLabel = (id: string) => themes.find((x) => x.id === id)?.name ?? id
  return (
    <div className="manage">
      <nav className="tabs subtabs" aria-label={t('manage.tabs')}>
        {SECTIONS.map((x) => (
          <a key={x.id} href={href(['carnet', 'gerer', x.id])} aria-current={section === x.id ? 'page' : undefined}>{t(x.label)}</a>
        ))}
      </nav>
      {section === 'philosophies' && <PhilosophiesSection st={st} view={view} />}
      {section === 'topics' && <TopicsSection st={st} view={view} />}
      {section === 'families' && (
        <NamedList<Family>
          items={st.families} label={familyLabel} kind="family" color used={(id) => st.philosophies.filter((p) => p.family === id).length}
          onSave={st.saveFamily} onDelete={st.deleteFamily} onReorder={(l) => st.reorder('families', l)}
          make={(name, order) => ({ id: slugify(name, st.families.map((f) => f.id)), name, color: '#7a6a55', order })}
        />
      )}
      {section === 'themes' && (
        <NamedList<Theme>
          items={st.themes} label={themeLabel} kind="theme" used={(id) => st.topics.filter((x) => x.theme === id).length}
          onSave={st.saveTheme} onDelete={st.deleteTheme} onReorder={(l) => st.reorder('themes', l)}
          make={(name, order) => ({ id: slugify(name, st.themes.map((x) => x.id)), name, order })}
        />
      )}
      {section === 'backup' && <BackupSection st={st} />}
      {section === 'account' && <AccountSection email={email} onSignOut={onSignOut} />}
    </div>
  )
}
