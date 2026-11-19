import { createClient } from '@supabase/supabase-js'

// L'URL et la clé anonyme sont publiques par conception : la sécurité vient de la RLS.
// Jamais de clé service_role dans le navigateur.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } },
)
