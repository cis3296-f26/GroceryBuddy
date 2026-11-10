import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase, useSession } from '../supabase'
import '../App.css'
import './Dashboard.css'
import { CATEGORIES, getSampleFridgeItems } from '../data/dashboardItems'

const NAV_ITEMS = [
  { label: 'Dashboard', active: true },
  { label: 'Add item' },
  { label: 'Shopping list' },
  { label: 'Recipe ideas', badge: 'Soon' },
  { label: 'Settings' },
]

const RECIPE_IDEAS = ['Spinach omelette', 'Yogurt parfait', 'Cheesy rice bowl']

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const session = useSession()
  const meta = session?.user?.user_metadata
  const name =
    state?.answers?.name || (meta?.full_name || meta?.name || '').split(' ')[0]

  useEffect(() => {
    if (session === null) navigate('/', { replace: true })
  }, [session, navigate])
  const [items, setItems] = useState(getSampleFridgeItems)
  const [query, setQuery] = useState('')

  const visible = items.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const todayCount = items.filter((item) => item.category === 'useToday').length

  function remove(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <a className="brand" href="/" aria-label="GroceryBuddy home">
          <img className="brand-mark" src="/logo.svg" alt="" />
          grocerybuddy<span className="brand-dot">.</span>
        </a>
        <nav className="dash-nav" aria-label="Dashboard">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`dash-nav-item${item.active ? ' active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
            >
              <span className="dash-nav-dot" />
              {item.label}
              {item.badge && <span className="dash-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="dash-nav-item"
          onClick={() => supabase.auth.signOut()}
        >
          <span className="dash-nav-dot" />
          Sign out
        </button>
        <div className="dash-tip">
          <strong>Tip</strong>
          <p>Mark items used or tossed to keep your use-by estimates honest.</p>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1 className="dash-title">
              {greeting()}
              {name ? `, ${name}` : ''}
            </h1>
            <p className="dash-subtitle">
              {todayCount} {todayCount === 1 ? 'item needs' : 'items need'} you
              today.
            </p>
          </div>
          <div className="dash-tools">
            <input
              className="dash-search"
              type="search"
              placeholder="Search your fridge"
              aria-label="Search your fridge"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className="dash-add">
              Add item
            </button>
          </div>
        </div>

        <div className="dash-columns">
          {CATEGORIES.map((category) => {
            const list = visible.filter((item) => item.category === category.key)
            return (
              <section
                key={category.key}
                className={`dash-column tone-${category.tone}`}
                aria-label={category.label}
              >
                <div className="dash-column-head">
                  <span className="dash-chip">{category.label}</span>
                  <span className="dash-count">{list.length}</span>
                </div>
                {list.map((item) => (
                  <article className="dash-card" key={item.id}>
                    <div className="dash-card-body">
                      <span className="dash-card-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {item.location} · {item.detail}
                        </p>
                      </div>
                    </div>
                    <div className="dash-card-actions">
                      <button
                        type="button"
                        className="dash-used"
                        onClick={() => remove(item.id)}
                      >
                        Used
                      </button>
                      <button
                        type="button"
                        className="dash-tossed"
                        onClick={() => remove(item.id)}
                      >
                        Tossed
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            )
          })}
        </div>

        <section className="dash-banner">
          <div>
            <h2>Hungry? Cook what expires first.</h2>
            <p>Recipe ideas built from the food in your fridge.</p>
            <div className="dash-recipes">
              {RECIPE_IDEAS.map((idea) => (
                <span key={idea}>{idea}</span>
              ))}
            </div>
          </div>
          <div className="dash-banner-side">
            <span className="dash-soon">Coming soon</span>
            <span className="dash-banner-art" aria-hidden="true">
              🥛 🥬 🥚
            </span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
