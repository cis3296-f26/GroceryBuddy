import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../supabase'

function AuthCallback() {
  const navigate = useNavigate()
  const session = useSession()

  useEffect(() => {
    if (session === undefined) return
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    localStorage.setItem('gb_returning', '1')
    const meta = session.user.user_metadata || {}
    if (meta.onboarded === true) {
      navigate('/dashboard', { replace: true })
    } else {
      const fullName = meta.full_name || meta.name || ''
      navigate('/onboarding', {
        replace: true,
        state: { googleName: fullName.split(' ')[0] },
      })
    }
  }, [session, navigate])

  return null
}

export default AuthCallback
