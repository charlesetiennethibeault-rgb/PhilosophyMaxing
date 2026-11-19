import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/eb-garamond/latin-500.css'
import '@fontsource/eb-garamond/latin-ext-500.css'
import '@fontsource/source-serif-4/latin-ext-400.css'
import '@fontsource/source-serif-4/latin-ext-600.css'
import '@fontsource/eb-garamond/latin-600.css'
import '@fontsource/eb-garamond/latin-500-italic.css'
import '@fontsource/source-serif-4/latin-400.css'
import '@fontsource/source-serif-4/latin-400-italic.css'
import '@fontsource/source-serif-4/latin-600.css'
import './styles.css'
import './phase2.css'
import './phase3.css'
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
