import { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import { supabase } from './supabase'

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ session: undefined, error: '' })
  useEffect(() => {
    let active = true
    let changed = false
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      changed = true
      if (active) setAuth({ session, error: '' })
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !changed) setAuth({ session: data.session, error: error ? 'Could not restore your sign-in. Please try again.' : '' })
    }).catch(() => {
      if (active && !changed) setAuth({ session: null, error: 'Could not restore your sign-in. Please try again.' })
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
