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

export default function Login() {
  const saved = rememberedEmail()
  const [mode, setMode] = useState<'password' | 'link'>('password')
  const [email, setEmail] = useState(saved)
  const [changing, setChanging] = useState(!saved)
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending'); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setState('error')
      setError(/invalid login/i.test(error.message)
        ? 'Code secret incorrect. Si tu n’en as pas encore défini pour cette adresse, utilise le lien par courriel.'
        : error.message)
    } else {
      rememberEmail(email.trim())
    }
  }

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending'); setError('')
    const redirect = window.location.href.split('#')[0].split('?')[0]
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect } })
    if (error) { setState('error'); setError(error.message) } else setState('sent')
  }

  const emailField = changing ? (
    <>
      <label htmlFor="email">Adresse courriel</label>
      <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
    </>
  ) : (
    <p className="meta">
      Connexion en tant que <strong>{mask(email)}</strong>{' '}
      <button type="button" className="link-inline" onClick={() => { forgetEmail(); setChanging(true); setEmail('') }}>Changer d’adresse</button>
    </p>
  )

  useEffect(() => { setState('idle'); setError('') }, [mode])

  return (
    <main className="login">
      <h1>PhilosophyMaxing</h1>
      <p className="tagline">Mon carnet de recherche sur 87 philosophies.</p>

      {mode === 'password' ? (
        <form onSubmit={signInWithPassword}>
          {emailField}
          <label htmlFor="password">Code secret</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus={!changing} />
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state === 'sending'}>{state === 'sending' ? 'Ouverture…' : 'Ouvrir mon carnet'}</button>
          {state === 'error' && <p className="error" role="alert">{error}</p>}
          <button type="button" className="btn btn-ghost" onClick={() => setMode('link')}>Code oublié ou pas encore défini ? Recevoir un lien par courriel</button>
        </form>
      ) : state === 'sent' ? (
        <div className="message" role="status">
          <p><strong>Lien envoyé.</strong> Ouvre le courriel reçu sur cet appareil et clique sur le lien pour entrer.</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMode('password')}>Retour au code secret</button>
        </div>
      ) : (
        <form onSubmit={sendLink}>
          {emailField}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state === 'sending'}>
            {state === 'sending' ? 'Envoi…' : 'Recevoir mon lien de connexion'}
          </button>
          {state === 'error' && <p className="error" role="alert">Envoi impossible : {error}</p>}
          <button type="button" className="btn btn-ghost" onClick={() => setMode('password')}>Retour au code secret</button>
        </form>
      )}
    </main>
  )
}
