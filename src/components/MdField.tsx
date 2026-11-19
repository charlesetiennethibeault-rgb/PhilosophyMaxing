import { useState } from 'react'
import Markdown from './Markdown'

export default function MdField({ id, label, hint, value, onChange }: { id: string; label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  return (
    <section className={`mdfield tab-${tab}`}>
      <div className="mdfield-head">
        <label htmlFor={id}><h3>{label}</h3></label>
        <div className="tabs" role="tablist" aria-label={`${label} : écrire ou aperçu`}>
          <button type="button" role="tab" aria-selected={tab === 'write'} className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>Écrire</button>
          <button type="button" role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Aperçu</button>
        </div>
      </div>
      <div className="mdfield-body">
        <textarea id={id} value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)} spellCheck lang="fr" />
        <div className="preview" aria-label="Aperçu Markdown"><Markdown text={value} /></div>
      </div>
    </section>
  )
}
