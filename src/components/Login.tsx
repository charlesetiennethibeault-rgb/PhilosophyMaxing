import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const EMAIL_KEY = 'pm.email'

/** L'adresse est mémorisée sur cet appareil seulement (jamais dans le code publié). */
export const rememberedEmail = () => { try { return localStorage.getItem(EMAIL_KEY) ?? '' } catch { return '' } }
export const rememberEmail = (email: string) => { try { localStorage.setItem(EMAIL_KEY, email) } catch { /* stockage indisponible */ } }
const forgetEmail = () => { try { localStorage.removeItem(EMAIL_KEY) } catch { /* stockage indisponible */ } }

const mask = (email: string) => email.replace(/^(.).*(@.*)$/, '$1•••$2')

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setLoading(false) })
    return () => data.subscription.unsubscribe()
  }, [])
  return { session, loading }
}

/** Connexion par courriel et code secret seulement : aucun courriel n'est envoyé. */
export default function Login() {
  const saved = rememberedEmail()
  const [email, setEmail] = useState(saved)
  const [changing, setChanging] = useState(!saved)
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => { if (state === 'error') setState('idle') }, [password, email]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending'); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setState('error')
      setError(/invalid login/i.test(error.message) ? 'Courriel ou code secret incorrect.' : error.message)
    } else {
      rememberEmail(email.trim())
    }
  }

  return (
    <main className="login" id="main">
      <h1>PhilosophyMaxing</h1>
      <p className="tagline">Mon carnet de recherche sur 87 philosophies.</p>

      <form onSubmit={submit}>
        {changing ? (
          <>
            <label htmlFor="email">Adresse courriel</label>
            <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
          </>
        ) : (
          <p className="meta">
            Connexion en tant que <strong>{mask(email)}</strong>
            <button type="button" className="link-inline" onClick={() => { forgetEmail(); setChanging(true); setEmail('') }}>Changer d’adresse</button>
          </p>
        )}
        <label htmlFor="password">Code secret</label>
        <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus={!changing} />
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state === 'sending'}>{state === 'sending' ? 'Ouverture…' : 'Ouvrir mon carnet'}</button>
        {state === 'error' && <p className="error" role="alert">{error}</p>}
        {changing && <p className="meta">Sur cet appareil, l’adresse n’est demandée qu’une seule fois : ensuite, seul le code secret suffit.</p>}
      </form>
    </main>
  )
}
