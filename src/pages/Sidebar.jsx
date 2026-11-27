import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import '../App.css'
import './Dashboard.css'

const NAV_ITEMS = ['Dashboard', 'Add item', 'Shopping list', 'Recipe ideas', 'Prior Wastes', 'Settings']
const ROUTES = {
  'Dashboard': '/dashboard',
  'Shopping list': '/shoppinglist',
  'Recipe ideas': '/recipes',
  'Prior Wastes': '/priorwastes',
  'Settings': '/settings'
}
const LIVE_ITEMS = ['Dashboard', 'Add item', 'Shopping list', 'Recipe ideas', 'Prior Wastes', 'Settings']
const STORAGE_KEY = 'gb_sidebar_collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function Chevron({ direction }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

function Sidebar({ setEditor, signOut, addActive = false }) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const path = window.location.pathname

  function toggle() {
    setCollapsed(value => {
      try {
        localStorage.setItem(STORAGE_KEY, value ? '0' : '1')
      } catch {
        // Storage can be blocked; the toggle still works for this page view.
      }
      return !value
    })
  }

  function handleSignOut() {
    if (signOut) signOut()
    else supabase.auth.signOut()
  }

  function open(label) {
    if (label === 'Add item') {
      // Off the dashboard there is no editor to open, so go there and open it.
      if (setEditor) setEditor({ item: null })
      else navigate('/dashboard', { state: { openEditor: true } })
    } else if (ROUTES[label]) {
      navigate(ROUTES[label])
    }
  }

  return (
    <aside className={`dash-sidebar${collapsed ? ' dash-sidebar--collapsed' : ''}`}>
      <div className="dash-sidebar-top">
        <a className="brand" href="/" aria-label="GroceryBuddy home">
          <img className="brand-mark" src="/logo.svg" alt="" />
          <span className="dash-label">grocerybuddy<span className="brand-dot">.</span></span>
        </a>
        <button
          type="button"
          className="dash-collapse"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Chevron direction={collapsed ? 'right' : 'left'} />
        </button>
      </div>

      <nav className="dash-nav" aria-label="Dashboard">
        {NAV_ITEMS.map(label => {
          // "Add item" is not a page: it is active while the add form is open,
          // and the Dashboard link then steps back so only one item is highlighted.
          const current = label === 'Add item'
            ? addActive
            : ROUTES[label] === path && !(label === 'Dashboard' && addActive)
          return (
            <button
              type="button"
              key={label}
              className={`dash-nav-item${current ? ' active' : ''}`}
              aria-current={current ? 'page' : undefined}
              aria-label={label}
              title={collapsed ? label : undefined}
              onClick={() => open(label)}
            >
              <span className="dash-nav-dot" />
              <span className="dash-label">{label}</span>
              {!LIVE_ITEMS.includes(label) && <span className="dash-nav-badge dash-label">Soon</span>}
            </button>
          )
        })}
      </nav>

      <button type="button" className="dash-nav-item" onClick={handleSignOut} aria-label="Sign out" title={collapsed ? 'Sign out' : undefined}>
        <span className="dash-nav-dot" />
        <span className="dash-label">Sign out</span>
      </button>

      <div className="dash-tip">
        <strong>Tip</strong>
        <p>Used and Tossed remove an item from your inventory.</p>
      </div>
    </aside>
  )
}

export default Sidebar
