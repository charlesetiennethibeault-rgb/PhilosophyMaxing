import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Aperçu Markdown : titres, listes, gras, liens, tableaux. Le HTML brut n'est pas interprété. */
export default function Markdown({ text }: { text: string }) {
  if (!text.trim()) return <p className="md-empty">Rien à afficher pour l’instant.</p>
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
