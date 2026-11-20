import { useEffect, useState } from 'react'
import { api } from '../api'
import Sidebar from './Sidebar.jsx'
import './ShoppingList.css'

/*
 * Flow: plan -> shop -> done.
 *  1. Plan: type an item and press Enter (or let the assistant suggest items).
 *  2. Shop: Shop mode hides the planning tools and enlarges rows; ticking an
 *     item moves it into "In cart" so the remaining list always shrinks.
 *  3. Done: when everything is in the cart, one tap clears it and exits.
 */

const STORAGE_KEY = 'gb_shopping_list'
const CATEGORIES = ['Produce', 'Dairy', 'Protein', 'Pantry', 'Frozen', 'Other']
const CATEGORY_EMOJI = {
  Produce: '🥬', Dairy: '🥛', Protein: '🍗', Pantry: '🥫', Frozen: '🧊', Other: '🛒',
}

// Inventory categories (from the backend) mapped onto shopping aisles.
const AISLE_FOR = {
  Fruit: 'Produce', Vegetable: 'Produce', Dairy: 'Dairy', Eggs: 'Dairy',
  Protein: 'Protein', Meat: 'Protein', Seafood: 'Protein',
  Grain: 'Pantry', Bread: 'Pantry', Pantry: 'Pantry', Beverage: 'Other',
}

const KEYWORDS = [
  ['Frozen', ['frozen', 'ice cream', 'popsicle']],
  ['Produce', ['apple', 'banana', 'berry', 'strawberr', 'lettuce', 'spinach', 'tomato', 'onion', 'carrot', 'orange', 'lemon', 'avocado', 'potato', 'pepper', 'broccoli', 'grape', 'fruit', 'vegetable', 'garlic']],
  ['Dairy', ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg']],
  ['Protein', ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'shrimp', 'tofu', 'bacon', 'sausage', 'steak']],
  ['Pantry', ['rice', 'pasta', 'bread', 'flour', 'sugar', 'cereal', 'oil', 'sauce', 'bean', 'tortilla', 'oat', 'salt', 'spice', 'nut']],
]

function guessCategory(name) {
  const food = name.toLowerCase()
  const match = KEYWORDS.find(([, words]) => words.some(word => food.includes(word)))
  return match ? match[0] : 'Other'
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function money(value) {
  return `$${value.toFixed(2)}`
}

export default function ShoppingList() {
  const [items, setItems] = useState(loadItems)
  const [shopMode, setShopMode] = useState(false)
  const [draft, setDraft] = useState({ name: '', quantity: '1', category: 'Auto', price: '' })
  const [notice, setNotice] = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage can be blocked; the list still works for this visit.
    }
  }, [items])

  const toBuy = items.filter(item => !item.checked)
  const inCart = items.filter(item => item.checked)
  const progress = items.length ? Math.round((inCart.length / items.length) * 100) : 0
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const cartTotal = inCart.reduce((sum, item) => sum + item.price, 0)

  const groups = CATEGORIES
    .map(category => ({ category, rows: toBuy.filter(item => item.category === category) }))
    .filter(group => group.rows.length > 0)

  function addItem({ name, quantity, category, price }) {
    const clean = name.trim()
    if (!clean) return false
    if (items.some(item => item.name.toLowerCase() === clean.toLowerCase() && !item.checked)) {
      setNotice(`${clean} is already on your list.`)
      return false
    }
    setItems(current => [...current, {
      id: crypto.randomUUID(),
      name: clean,
      quantity: String(quantity || '1').trim() || '1',
      category: category && category !== 'Auto' ? category : guessCategory(clean),
      price: Number(price) || 0,
      checked: false,
    }])
    setNotice('')
    return true
  }

  function handleAdd(event) {
    event.preventDefault()
    if (addItem(draft)) setDraft({ name: '', quantity: '1', category: draft.category, price: '' })
  }

  function toggle(id) {
    setItems(current => current.map(item => item.id === id ? { ...item, checked: !item.checked } : item))
  }

  function remove(id) {
    setItems(current => current.filter(item => item.id !== id))
  }

  function clearCart() {
    setItems(current => current.filter(item => !item.checked))
  }

  function clearAll() {
    if (items.length && window.confirm('Clear your whole shopping list?')) setItems([])
  }

  function finishTrip() {
    clearCart()
    setShopMode(false)
  }

  async function suggest() {
    setSuggesting(true)
    setSuggestError('')
    try {
      const data = await api('shopping/generate/', { method: 'POST', body: {} })
      const onList = new Set(items.map(item => item.name.toLowerCase()))
      const fresh = (data.items || []).filter(item => !onList.has(item.name.toLowerCase()))
      setSuggestions(fresh)
    } catch (err) {
      setSuggestError(err.status === 429
        ? 'Slow down a little: try again in a moment.'
        : err.message || 'Could not get suggestions. Please try again.')
    } finally {
      setSuggesting(false)
    }
  }

  function addSuggestion(suggestion) {
    addItem({
      name: suggestion.name,
      quantity: suggestion.quantity,
      category: AISLE_FOR[suggestion.category] || 'Other',
    })
    setSuggestions(current => current.filter(item => item.name !== suggestion.name))
  }

  function addAllSuggestions() {
    suggestions.forEach(addSuggestion)
  }

  return (
    <div className="dash-shell">
      <Sidebar />
      <main className={`shopping-page${shopMode ? ' shopping-page--shop' : ''}`}>
        <header className="sl-heading">
          <div>
            <h1>{shopMode ? 'Shopping now' : 'Shopping list'}</h1>
            <p>
              {shopMode
                ? 'Tick things off as they go in your cart.'
                : 'Plan your trip, then switch to Shop mode at the store.'}
            </p>
          </div>
          <button
            type="button"
            className={shopMode ? 'sl-btn sl-btn--ghost' : 'sl-btn'}
            onClick={() => setShopMode(value => !value)}
            disabled={!items.length && !shopMode}
          >
            {shopMode ? 'Back to planning' : '🛒 Start shopping'}
          </button>
        </header>

        {items.length > 0 && (
          <section className="sl-progress" aria-label="Shopping progress">
            <div className="sl-progress-top">
              <strong>{inCart.length} of {items.length} in cart</strong>
              {total > 0 && <span>{money(cartTotal)} of about {money(total)}</span>}
            </div>
            <div className="sl-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </section>
        )}

        {!shopMode && (
          <>
            <form className="sl-add" onSubmit={handleAdd}>
              <input
                className="sl-add-name"
                value={draft.name}
                onChange={event => setDraft({ ...draft, name: event.target.value })}
                placeholder="Add an item, e.g. Strawberries"
                aria-label="Item name"
                autoComplete="off"
              />
              <input
                className="sl-add-qty"
                value={draft.quantity}
                onChange={event => setDraft({ ...draft, quantity: event.target.value })}
                placeholder="Qty"
                aria-label="Quantity"
              />
              <select
                value={draft.category}
                onChange={event => setDraft({ ...draft, category: event.target.value })}
                aria-label="Aisle"
              >
                <option value="Auto">Auto aisle</option>
                {CATEGORIES.map(category => <option key={category}>{category}</option>)}
              </select>
              <input
                className="sl-add-price"
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={event => setDraft({ ...draft, price: event.target.value })}
                placeholder="$ (optional)"
                aria-label="Estimated price"
              />
              <button type="submit" className="sl-btn" disabled={!draft.name.trim()}>Add</button>
            </form>
            {notice && <p className="sl-notice" role="status">{notice}</p>}

            <section className="sl-suggest" aria-label="Suggested items">
              <div className="sl-suggest-head">
                <div>
                  <h2>Running low?</h2>
                  <p>Get ideas for what to restock based on your fridge.</p>
                </div>
                <button type="button" className="sl-btn sl-btn--ghost" onClick={suggest} disabled={suggesting}>
                  {suggesting ? 'Thinking…' : suggestions ? 'Refresh ideas' : '✨ Suggest items'}
                </button>
              </div>
              {suggestError && <p role="alert" className="sl-error">{suggestError}</p>}
              {suggestions && suggestions.length === 0 && (
                <p className="sl-muted">Nothing new to suggest right now. Your list looks well stocked.</p>
              )}
              {suggestions && suggestions.length > 0 && (
                <>
                  <ul className="sl-suggest-list">
                    {suggestions.map(suggestion => (
                      <li key={suggestion.name}>
                        <div>
                          <strong>{suggestion.name}</strong>
                          <span>{suggestion.reason}</span>
                        </div>
                        <button type="button" onClick={() => addSuggestion(suggestion)} aria-label={`Add ${suggestion.name}`}>
                          + Add
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="sl-link" onClick={addAllSuggestions}>Add all</button>
                </>
              )}
            </section>
          </>
        )}

        {items.length === 0 && (
          <div className="sl-empty">
            <span aria-hidden="true">🧺</span>
            <h2>Your list is empty</h2>
            <p>Type an item above, or tap “Suggest items” to get started.</p>
          </div>
        )}

        {groups.map(({ category, rows }) => (
          <section className="sl-group" key={category} aria-label={category}>
            <h2>
              <span aria-hidden="true">{CATEGORY_EMOJI[category]}</span>
              {category}
              <em>{rows.length}</em>
            </h2>
            <ul>
              {rows.map(item => (
                <li className="sl-row" key={item.id}>
                  <label>
                    <input type="checkbox" checked={item.checked} onChange={() => toggle(item.id)} />
                    <span className="sl-check" aria-hidden="true" />
                    <span className="sl-name">{item.name}</span>
                  </label>
                  <span className="sl-qty">{item.quantity}</span>
                  {item.price > 0 && <span className="sl-price">{money(item.price)}</span>}
                  {!shopMode && (
                    <button type="button" className="sl-remove" aria-label={`Remove ${item.name}`} onClick={() => remove(item.id)}>×</button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {items.length > 0 && toBuy.length === 0 && (
          <div className="sl-done">
            <span aria-hidden="true">🎉</span>
            <h2>Everything is in your cart</h2>
            <button type="button" className="sl-btn" onClick={finishTrip}>Finish trip &amp; clear cart</button>
          </div>
        )}

        {inCart.length > 0 && (
          <section className="sl-group sl-cart" aria-label="In cart">
            <h2>
              <span aria-hidden="true">✅</span>
              In cart
              <em>{inCart.length}</em>
              <button type="button" className="sl-link" onClick={clearCart}>Clear cart</button>
            </h2>
            <ul>
              {inCart.map(item => (
                <li className="sl-row sl-row--done" key={item.id}>
                  <label>
                    <input type="checkbox" checked={item.checked} onChange={() => toggle(item.id)} />
                    <span className="sl-check" aria-hidden="true" />
                    <span className="sl-name">{item.name}</span>
                  </label>
                  <span className="sl-qty">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!shopMode && items.length > 0 && (
          <button type="button" className="sl-link sl-clear-all" onClick={clearAll}>Clear whole list</button>
        )}
      </main>
    </div>
  )
}
