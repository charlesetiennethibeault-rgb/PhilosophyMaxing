import { StrictMode } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { createRoot } from 'react-dom/client'
import '@fontsource/source-serif-4/latin-ext-400.css'
import '@fontsource/source-serif-4/latin-ext-600.css'
import '@fontsource/source-serif-4/latin-400.css'
import '@fontsource/source-serif-4/latin-400-italic.css'
import '@fontsource/source-serif-4/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-700.css'
import '@fontsource/ibm-plex-sans/latin-ext-400.css'
import '@fontsource/ibm-plex-sans/latin-ext-500.css'
import '@fontsource/ibm-plex-sans/latin-ext-600.css'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource/cinzel/latin-700.css'
import '@fontsource/cinzel/latin-ext-600.css'
import '@fontsource/cinzel/latin-ext-700.css'
import '@fontsource-variable/shantell-sans/full.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shell.css'
import './styles/screens.css'
import './styles/roman.css'
import './styles/carnet.css'
import App from './App'
import Login, { rememberEmail, useSession } from './components/Login'
import { supabase } from './lib/supabase'

function Root() {
  const { session, loading } = useSession()
  if (loading) return <main className="login"><h1>PhilosophyMaxing</h1></main>
  if (!session) return <Login />
  if (session.user.email) rememberEmail(session.user.email)
  return (
    <App
      key={session.user.id}
      userId={session.user.id}
      email={session.user.email ?? ''}
      onSignOut={() => void supabase.auth.signOut()}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

// Nouvelle version : le service worker s'active et la page se recharge toute seule (plus de Ctrl+Maj+R).
registerSW({ immediate: true })
