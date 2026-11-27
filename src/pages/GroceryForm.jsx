import { useState } from 'react'
import { FOOD_CATEGORIES, STORAGE_LOCATIONS, localDate } from '../data/dashboardItems'

export default function GroceryForm({ item, onSave, onCancel }) {
  const [draft, setDraft] = useState(item || {
    name: '', quantity: 1, category: '', storage_location: 'fridge',
    purchase_date: localDate(), expiration_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  function change(event) {
    const { name, value } = event.target
    setDraft(previous => ({ ...previous, [name]: value }))
  }
  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const { name, quantity, category, storage_location, purchase_date, expiration_date } = draft
    try {
      // An empty category means Auto-detect, so the backend matcher picks it.
      await onSave({ name: name.trim(), quantity: Number(quantity), ...(category ? { category } : {}), storage_location, purchase_date, expiration_date: expiration_date || null })
    } catch (error) { setError(error.message) }
    finally { setSaving(false) }
  }
  return (

 <div className="dash-modal-overlay" onClick={onCancel}>
  <section className="dash-editor" aria-label={item ? `Edit ${item.name}` : 'Add grocery item'} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
    <form onSubmit={submit}>
      <fieldset disabled={saving}>
        <legend>{item ? 'Edit grocery item' : 'Add grocery item'}</legend>
        <label>Name<input name="name" autoFocus required maxLength={100} pattern=".*\S.*" value={draft.name} onChange={change} /></label>
        <label>Quantity<input name="quantity" type="number" min={item ? 0 : 1} step="1" required value={draft.quantity} onChange={change} /></label>
        <label>Category<select aria-label="Category" name="category" value={draft.category} onChange={change}>{!item && <option value="">Auto-detect</option>}{FOOD_CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Storage<select aria-label="Storage" name="storage_location" value={draft.storage_location} onChange={change}>{STORAGE_LOCATIONS.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Purchase date<input name="purchase_date" type="date" required value={draft.purchase_date} onChange={change} /></label>
        <label>Expiration date (optional)<input name="expiration_date" type="date" value={draft.expiration_date || ''} onChange={change} /></label>
        {error && <p role="alert">{error}</p>}
        <div className="dash-editor-actions">
          <button type="submit" className="dash-add">{saving ? 'Saving…' : 'Save item'}</button>
          <button type="button" className="dash-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </fieldset>
    </form>
  </section>
  </div>
   );
}
