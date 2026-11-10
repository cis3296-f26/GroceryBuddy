import { useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import { useSession } from './supabase'
import './App.css'

const PAGE_ORDER = ['/', '/onboarding', '/dashboard']
const SLIDE_MS = 500

function PageRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
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
  const session = useSession()

  useEffect(() => {
    if (session && location.pathname === '/') navigate('/dashboard', { replace: true })
  }, [session, location.pathname, navigate])

  useEffect(() => {
    if (location.key === current.key) return
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
  }, [location, current])

  useEffect(() => () => clearTimeout(timer.current), [])

  if (!previous) return <PageRoutes location={current} />

  return (
    <div className="slide-stage" style={{ '--slide-ms': `${SLIDE_MS}ms` }}>
      <div className={`slide-panel slide-out-${direction}`}>
        <PageRoutes location={previous} />
      </div>
      <div className={`slide-panel slide-in-${direction}`}>
        <PageRoutes location={current} />
      </div>
    </div>
  )
}

export default App
