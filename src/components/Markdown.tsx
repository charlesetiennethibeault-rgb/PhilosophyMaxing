import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLang } from '../i18n'

/** Aperçu Markdown : titres, listes, gras, liens, tableaux. Le HTML brut n'est pas interprété. */
export default function Markdown({ text }: { text: string }) {
  const { t } = useLang()
  if (!text.trim()) return <p className="md-empty">{t('md.empty')}</p>
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: ({ node: _n, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
