import { useState } from 'react'
import Markdown from './Markdown'
import { useLang } from '../i18n'

interface Props { id: string; label: string; hint: string; value: string; onChange: (v: string) => void }

/** Zone d'écriture Markdown : texte à gauche, aperçu à côté sur grand écran, onglets sur téléphone. */
export default function MdField({ id, label, hint, value, onChange }: Props) {
  const { t, lang } = useLang()
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  return (
    <section className={`mdfield tab-${tab}`}>
      <div className="mdfield-head">
        <label htmlFor={id} className="h3">{label}</label>
        <div className="seg-group mdfield-tabs" role="tablist" aria-label={t('md.tabsAria', { label })}>
          <button type="button" role="tab" aria-selected={tab === 'write'} className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>{t('md.write')}</button>
          <button type="button" role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>{t('md.preview')}</button>
        </div>
      </div>
      <div className="mdfield-body">
        <textarea id={id} className="write" value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)} spellCheck lang={lang} />
        <div className="preview" aria-label={t('md.previewAria')}><Markdown text={value} /></div>
      </div>
    </section>
  )
}
