import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import { useAuth } from './supabase'
import './App.css'

const PAGE_ORDER = ['/', '/onboarding', '/dashboard']
const SLIDE_MS = 500

function PageRoutes({ location }) {
  const { session } = useAuth()
  return (
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={session ? <Dashboard key={session.user.id} /> : <Navigate to="/" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  )
}

function App() {
  const location = useLocation()
  const [current, setCurrent] = useState(location)
  const [previous, setPrevious] = useState(null)
  const [direction, setDirection] = useState('forward')
  const timer = useRef(null)
  const navigate = useNavigate()
  const { session, error } = useAuth()

  useEffect(() => {
    if (session && location.pathname === '/') navigate('/dashboard', { replace: true })
  }, [session, location.pathname, navigate])

  useEffect(() => {
    if (location.key === current.key) return
    const frame = window.requestAnimationFrame(() => {
      clearTimeout(timer.current)
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      if (reduceMotion || location.pathname === current.pathname) {
        setPrevious(null)
        setCurrent(location)
        return
      }
      const goingForward =
        PAGE_ORDER.indexOf(location.pathname) >
        PAGE_ORDER.indexOf(current.pathname)
      setDirection(goingForward ? 'forward' : 'back')
      setPrevious(current)
      setCurrent(location)
      timer.current = setTimeout(() => setPrevious(null), SLIDE_MS)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location, current])

  useEffect(() => () => clearTimeout(timer.current), [])

  if (session === undefined) return <p role="status">Loading GroceryBuddy…</p>

  return (
    <>
      {error && <p role="alert">{error} <button type="button" onClick={() => window.location.reload()}>Retry</button></p>}
      {!previous ? (
        <PageRoutes location={current} />
      ) : (
        <div className="slide-stage" style={{ '--slide-ms': `${SLIDE_MS}ms` }}>
          <div className={`slide-panel slide-out-${direction}`}>
            <PageRoutes location={previous} />
          </div>
          <div className={`slide-panel slide-in-${direction}`}>
            <PageRoutes location={current} />
          </div>
        </div>
      )}
    </>
  )
}

export default App
