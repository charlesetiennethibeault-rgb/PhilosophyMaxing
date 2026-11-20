import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { LANGS, useLang } from '../i18n'

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

/** Choix de la langue avant même d'être connecté : le français et l'anglais sont toujours proposés, chacun dans sa langue. */
export function LanguageLinks() {
  const { lang, setLang, t } = useLang()
  return (
    <p className="meta lang-links" role="group" aria-label={t('lang.label')}>
      {LANGS.map((l, i) => (
        <span key={l}>
          {i > 0 && ' · '}
          {lang === l
            ? <strong lang={l} aria-current="true">{l === 'fr' ? 'Français' : 'English'}</strong>
            : <button type="button" className="link-inline" lang={l} onClick={() => setLang(l)}>{l === 'fr' ? 'Français' : 'English'}</button>}
        </span>
      ))}
    </p>
  )
}

/** Connexion par courriel et code secret seulement : aucun courriel n'est envoyé. */
export default function Login() {
  const { t } = useLang()
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
      setError(/invalid login/i.test(error.message) ? t('login.wrong') : error.message)
    } else {
      rememberEmail(email.trim())
    }
  }

  return (
    <main className="login" id="main">
      <h1>{t('app.name')}</h1>
      <p className="tagline">{t('login.tagline')}</p>

      <form onSubmit={submit}>
        {changing ? (
          <>
            <label htmlFor="email">{t('login.email')}</label>
            <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} />
          </>
        ) : (
          <p className="meta">
            {t('login.as')}<strong>{mask(email)}</strong>
            <button type="button" className="link-inline" onClick={() => { forgetEmail(); setChanging(true); setEmail('') }}>{t('login.change')}</button>
          </p>
        )}
        <label htmlFor="password">{t('login.passcode')}</label>
        <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus={!changing} />
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={state === 'sending'}>{state === 'sending' ? t('login.opening') : t('login.open')}</button>
        {state === 'error' && <p className="error" role="alert">{error}</p>}
        {changing && <p className="meta">{t('login.once')}</p>}
      </form>
      <LanguageLinks />
    </main>
  )
}
