import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, useSession } from '../supabase'
import { api } from '../api'
import { CATEGORIES, freshness } from '../data/dashboardItems'
import GroceryForm from './GroceryForm'
import '../App.css'
import './Dashboard.css'

const NAV_ITEMS = ['Dashboard', 'Add item', 'Shopping list', 'Recipe ideas', 'Settings']

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const { state } = useLocation()
  const session = useSession()
  const meta = session?.user?.user_metadata
  const name = state?.answers?.name || (meta?.full_name || meta?.name || '').split(' ')[0]
  const owner = session?.user?.id
  const [inventory, setInventory] = useState({ items: [], loading: true, error: '' })
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const editorRef = useRef(null)
  const { items, loading, error } = inventory

  useEffect(() => {
    if (!owner) return
    const controller = new AbortController()
    api('inventory/items/', { signal: controller.signal }).then(items => {
      if (!Array.isArray(items)) throw new Error('The grocery service returned an invalid response.')
      if (!controller.signal.aborted) setInventory({ items, loading: false, error: '' })
    }).catch(error => {
      if (!controller.signal.aborted) setInventory(previous => ({ ...previous, loading: false, error: error.message }))
    })
    return () => controller.abort()
  }, [owner, reload])

  useEffect(() => {
    if (editor) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [editor])

  function retry() {
    setInventory(previous => ({ ...previous, loading: true, error: '' }))
    setReload(value => value + 1)
  }

  async function save(payload) {
    const item = editor.item
    const saved = await api(item ? `inventory/items/${item.id}/` : 'inventory/items/', {
      method: item ? 'PATCH' : 'POST', body: payload,
    })
    setInventory(previous => ({ ...previous, items: item
      ? previous.items.map(existing => existing.id === saved.id ? saved : existing)
      : [...previous.items, saved] }))
    setEditor(null)
  }

  async function remove(item) {
    setBusyId(item.id)
    setActionError('')
    try {
      await api(`inventory/items/${item.id}/`, { method: 'DELETE' })
      setInventory(previous => ({ ...previous, items: previous.items.filter(existing => existing.id !== item.id) }))
      if (editor?.item?.id === item.id) setEditor(null)
    } catch (error) { setActionError(error.message) }
    finally { setBusyId(null) }
  }

  async function signOut() {
    setActionError('')
    const { error } = await supabase.auth.signOut()
    if (error) setActionError('Could not sign out. Please try again.')
  }

  const available = items.filter(item => item.quantity > 0)
  const visible = available.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()))
  const todayCount = available.filter(item => freshness(item) === 'useToday').length

  return <div className="dash-shell">
    <aside className="dash-sidebar">
      <a className="brand" href="/" aria-label="GroceryBuddy home">
        <img className="brand-mark" src="/logo.svg" alt="" />
        grocerybuddy<span className="brand-dot">.</span>
      </a>
      <nav className="dash-nav" aria-label="Dashboard">
        {NAV_ITEMS.map(label => <button type="button" key={label}
          className={`dash-nav-item${label === 'Dashboard' ? ' active' : ''}`}
          aria-current={label === 'Dashboard' ? 'page' : undefined}
          disabled={!['Dashboard', 'Add item'].includes(label)}
          onClick={() => label === 'Add item' ? setEditor({ item: null }) : window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="dash-nav-dot" />{label}
          {!['Dashboard', 'Add item'].includes(label) && <span className="dash-nav-badge">Soon</span>}
        </button>)}
      </nav>
      <button type="button" className="dash-nav-item" onClick={signOut}>
        <span className="dash-nav-dot" />Sign out
      </button>
      <div className="dash-tip"><strong>Tip</strong><p>Used and Tossed remove an item from your inventory.</p></div>
    </aside>

    <main className="dash-main">
      <div className="dash-top">
        <div>
          <h1 className="dash-title">{greeting()}{name ? `, ${name}` : ''}</h1>
          <p className="dash-subtitle">{loading ? 'Loading your groceries…' : error ? 'Your grocery inventory could not be loaded.' : `${todayCount} ${todayCount === 1 ? 'item needs' : 'items need'} you today.`}</p>
        </div>
        <div className="dash-tools">
          <input className="dash-search" type="search" placeholder="Search your fridge" aria-label="Search your fridge"
            value={query} onChange={event => setQuery(event.target.value)} />
          <button type="button" className="dash-add" onClick={() => setEditor({ item: null })}>Add item</button>
        </div>
      </div>
      {loading && <p role="status">Loading groceries…</p>}
      {error && <p role="alert">{error} <button type="button" onClick={retry}>Retry</button></p>}
      {actionError && <p role="alert">{actionError}</p>}
      <div ref={editorRef}>
        {editor && <GroceryForm key={editor.item?.id || 'new'} item={editor.item} onSave={save} onCancel={() => setEditor(null)} />}
      </div>
      {!loading && !error && available.length === 0 && <p role="status">Your inventory is empty. Add your first grocery item.</p>}
      {!loading && !error && available.length > 0 && visible.length === 0 && <p role="status">No groceries match your search.</p>}
      <div className="dash-columns" aria-busy={loading}>
        {CATEGORIES.map(category => {
          const list = visible.filter(item => freshness(item) === category.key)
          return <section key={category.key} className={`dash-column tone-${category.tone}`} aria-label={category.label}>
            <div className="dash-column-head">
              <span className="dash-chip">{category.label}</span>
              <span className="dash-count">{loading || error ? '—' : list.length}</span>
            </div>
            {list.map(item => <article className="dash-card" key={item.id}>
              <div className="dash-card-body">
                <span className="dash-card-icon" aria-hidden="true">🛒</span>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.storage_location} · {item.category} · Quantity: {item.quantity}</p>
                  <p>Purchased: {item.purchase_date}</p>
                  <p>{item.expiration_date ? `Expires: ${item.expiration_date}` : 'Expiration date not set'}</p>
                </div>
              </div>
              <div className="dash-card-actions">
                <button type="button" className="dash-used" disabled={busyId !== null} onClick={() => setEditor({ item })} aria-label={`Edit ${item.name}`}>Edit</button>
                <button type="button" className="dash-used" disabled={busyId !== null} onClick={() => remove(item)} aria-label={`Mark ${item.name} used`}>Used</button>
                <button type="button" className="dash-tossed" disabled={busyId !== null} onClick={() => remove(item)} aria-label={`Mark ${item.name} tossed`}>{busyId === item.id ? 'Removing…' : 'Tossed'}</button>
              </div>
            </article>)}
          </section>
        })}
      </div>
      <section className="dash-banner">
        <div><h2>Hungry? Cook what expires first.</h2><p>Recipe ideas based on your groceries are coming soon.</p></div>
        <div className="dash-banner-side"><span className="dash-soon">Coming soon</span><span className="dash-banner-art" aria-hidden="true">🥛 🥬 🥚</span></div>
      </section>
    </main>
  </div>
}

export default Dashboard
