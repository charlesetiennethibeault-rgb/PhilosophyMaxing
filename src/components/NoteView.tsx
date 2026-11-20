import { useState } from 'react'
import { ArrowLeft, CircleCheck, CircleDashed, Contrast, ExternalLink, Plus, Star, Trash2, X } from 'lucide-react'
import MdField from './MdField'
import SyncLine from './SyncLine'
import { useData } from '../lib/DataContext'
import { useLang } from '../i18n'
import { frQuestion, ownLabel } from '../lib/ui'
import type { SyncStatus } from '../lib/sync'
import type { Note, NoteStatus, Philosophy, Source, SourceType, Topic } from '../lib/types'

interface Props {
  philosophy: Philosophy
  topic: Topic
  note: Note
  sync: SyncStatus
  onChange: (n: Note) => void
  onBack: () => void
}

const STATUS_ICON: Record<NoteStatus, typeof Contrast> = { empty: CircleDashed, draft: Contrast, deep: CircleCheck }
const SOURCE_TYPES: SourceType[] = ['livre', 'article', 'video']

function SourcesEditor({ sources, onChange }: { sources: Source[]; onChange: (s: Source[]) => void }) {
  const { t } = useLang()
  const set = (i: number, patch: Partial<Source>) => onChange(sources.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const isUrl = (u: string) => /^https?:\/\//i.test(u)
  return (
    <section className="sources">
      <h3>{t('sources.title')}</h3>
      {sources.length === 0 && <p className="empty-inline">{t('sources.none')}</p>}
      <ul>
        {sources.map((s, i) => (
          <li key={i}>
            <input aria-label={t('sources.titleAria', { n: i + 1 })} placeholder={t('sources.titlePlaceholder')} value={s.title} onChange={(e) => set(i, { title: e.target.value })} />
            <input aria-label={t('sources.urlAria', { n: i + 1 })} placeholder="https://…" type="url" inputMode="url" autoComplete="off" spellCheck={false} value={s.url} onChange={(e) => set(i, { url: e.target.value.trim() })} />
            <select aria-label={t('sources.typeAria', { n: i + 1 })} value={s.type} onChange={(e) => set(i, { type: e.target.value as SourceType })}>
              {SOURCE_TYPES.map((id) => <option key={id} value={id}>{t(`sourceType.${id}`)}</option>)}
            </select>
            <span className="source-actions">
              {isUrl(s.url) && <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">{t('common.open')}<ExternalLink size={16} aria-hidden="true" /></a>}
              <button type="button" className="icon-btn" aria-label={t('sources.delete', { n: i + 1 })} onClick={() => onChange(sources.filter((_, j) => j !== i))}><Trash2 size={20} aria-hidden="true" /></button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...sources, { title: '', url: '', type: 'livre' }])}>
        <Plus size={16} aria-hidden="true" />{t('sources.add')}
      </button>
    </section>
  )
}

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const { t } = useLang()
  const [draft, setDraft] = useState('')
  const add = () => {
    const tag = draft.trim().replace(/,$/, '')
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }
  return (
    <div className="tags">
      {tags.map((tag) => (
        <span key={tag} className="tag">{tag}<button type="button" aria-label={t('note.tagRemove', { tag })} onClick={() => onChange(tags.filter((x) => x !== tag))}><X size={16} aria-hidden="true" /></button></span>
      ))}
      <input
        aria-label={t('note.tagAdd')} placeholder={t('note.tagNew')} value={draft} autoComplete="off"
        onChange={(e) => setDraft(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
      />
    </div>
  )
}

export default function NoteView({ philosophy, topic, note, sync, onChange, onBack }: Props) {
  const { t } = useLang()
  const { themes } = useData()
  const own = topic.scope === 'own'
  const theme = themes.find((x) => x.id === topic.theme)
  const question = frQuestion(topic.question, philosophy.name, philosophy.ref, philosophy.plural)
  const set = (patch: Partial<Note>) => onChange({ ...note, ...patch })

  return (
    <main className="screen noteview notebook" id="main">
      <div className="sheet">
      <div className="note-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />{t('common.back')}</button>
        <SyncLine sync={sync} />
      </div>

      <header className="note-head">
        <p className="meta">{philosophy.name}{theme && <> · {theme.name}</>}</p>
        <div className="row">
          <h1>{topic.name}</h1>
          <button
            type="button" className="icon-btn" aria-pressed={note.favorite}
            aria-label={note.favorite ? t('note.favRemove') : t('note.favAdd')}
            onClick={() => set({ favorite: !note.favorite })}
          ><Star size={20} aria-hidden="true" fill={note.favorite ? 'currentColor' : 'none'} /></button>
        </div>
        {own && <p className="own-tag"><Star size={16} aria-hidden="true" fill="currentColor" />{ownLabel(philosophy.name, philosophy.ref)}</p>}
        <p className="question">{question}</p>
        {note.status === 'deep' && <p className="notice" role="status"><CircleCheck size={16} aria-hidden="true" />{t('note.alreadyDeep')}</p>}

        <fieldset className="seg-fieldset">
          <legend>{t('note.statusLegend')}</legend>
          <div className="seg-group">
            {(['empty', 'draft', 'deep'] as NoteStatus[]).map((s) => {
              const Icon = STATUS_ICON[s]
              return (
                <label key={s} className={`seg${note.status === s ? ' on' : ''}`}>
                  <input type="radio" name="status" checked={note.status === s} onChange={() => set({ status: s })} />
                  <Icon size={16} aria-hidden="true" />{t(`statusCap.${s}`)}
                </label>
              )
            })}
          </div>
        </fieldset>
      </header>

      <MdField id="research" label={t('note.research')} hint={t('note.researchHint')} value={note.research} onChange={(research) => set({ research, status: note.status === 'empty' && research.trim() ? 'draft' : note.status })} />
      <SourcesEditor sources={note.sources} onChange={(sources) => set({ sources })} />
      <MdField id="reaction" label={t('note.reaction')} hint={t('note.reactionHint')} value={note.reaction} onChange={(reaction) => set({ reaction })} />

      <section>
        <h3>{t('note.tags')}</h3>
        <TagsEditor tags={note.tags} onChange={(tags) => set({ tags })} />
      </section>
      </div>
    </main>
  )
}
