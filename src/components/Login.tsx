import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending'); setError('')
    const redirect = window.location.href.split('#')[0].split('?')[0]
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect } })
    if (error) { setState('error'); setError(error.message) } else setState('sent')
  }

  return (
    <main className="login">
      <h1>PhilosophyMaxing</h1>
      <p className="tagline">Mon carnet de recherche sur 87 philosophies.</p>
      {state === 'sent' ? (
        <div className="message" role="status">
          <p><strong>Lien envoyé.</strong> Ouvre le courriel reçu sur cet appareil et clique sur le lien pour entrer.</p>
          <button type="button" className="btn small" onClick={() => setState('idle')}>Utiliser une autre adresse</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">Adresse courriel</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
          <button type="submit" className="btn primary big" disabled={state === 'sending'}>
            {state === 'sending' ? 'Envoi…' : 'Recevoir mon lien de connexion'}
          </button>
          {state === 'error' && <p className="error" role="alert">Envoi impossible : {error}</p>}
        </form>
      )}
    </main>
  )
}
