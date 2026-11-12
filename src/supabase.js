import { useContext } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AuthContext } from './auth-context'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
}

// One shared subscription; undefined while loading, null when signed out.
export function useSession() {
  return useContext(AuthContext).session
}

export function useAuth() {
  return useContext(AuthContext)
}
