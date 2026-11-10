import { useRef, useState, useEffect } from 'react'
import './App.css'
import { api } from './api'


const questions = [
  {
    id: 'name',
    section: 'A little about you',
    title: 'First things first. What’s your name?',
    description: 'Let’s make your grocery routine feel a little more you.',
    placeholder: 'Your first name',
  },
  {
    id: 'goal',
    section: 'Your everyday goals',
    title: 'What brings you to GroceryBuddy?',
    description: 'Pick everything you’d like a hand with.',
    multi: true,
    options: [
      'Eat more balanced meals',
      'Spend less on groceries',
      'Save time planning',
      'Waste less food',
      'Get inspired in the kitchen',
    ],
  },
  {
    id: 'household',
    section: 'Your table',
    title: 'How many people are you shopping for?',
    description: 'This helps us understand the size of your grocery list.',
    options: ['Just me', '2 people', '3–4 people', '5 or more people'],
  },
  {
    id: 'diet',
    section: 'Your food preferences',
    title: 'How do you like to eat?',
    description: 'Choose the closest fit. There’s no right answer.',
    options: [
      'A bit of everything',
      'Vegetarian',
      'Vegan',
      'Pescatarian',
      'Flexitarian',
      'Something else',
    ],
    extra: true,
  },
  {
    id: 'allergies',
    section: 'Your food preferences',
    title: 'Any food allergies or intolerances?',
    description: 'Select all that apply. You can add anything we missed.',
    options: [
      'None',
      'Peanuts',
      'Tree nuts',
      'Dairy',
      'Eggs',
      'Wheat / gluten',
      'Soy',
      'Fish / shellfish',
      'Other',
    ],
    multi: true,
    extra: true,
  },
  {
    id: 'dislikes',
    section: 'Your food preferences',
    title: 'Anything you’d rather leave off the list?',
    description:
      'Foods you dislike, ingredients you avoid, or any other preferences.',
    placeholder: 'e.g. mushrooms, cilantro, pork…',
    optional: true,
  },
  {
    id: 'budget',
    section: 'Your grocery routine',
    title: 'What’s your weekly grocery budget?',
    description: 'A rough estimate for your whole household is perfect.',
    options: [
      'Under $50',
      '$50–$100',
      '$100–$150',
      '$150–$200',
      '$200+',
      'I’m figuring that out',
    ],
  },
  {
    id: 'cooking',
    section: 'Your grocery routine',
    title: 'How much time do you like to spend cooking?',
    description: 'Think of a typical weeknight dinner.',
    options: [
      'Under 15 minutes',
      '15–30 minutes',
      '30–45 minutes',
      'I enjoy taking my time',
    ],
  },
  {
    id: 'age',
    section: 'A little more about you',
    title: 'How old are you?',
    description: 'Skip anything you’d prefer not to share.',
    type: 'number',
    min: 1,
    max: 120,
    placeholder: 'Your age',
    unit: 'years',
    optional: true,
  },
  {
    id: 'sex',
    section: 'A little more about you',
    title: 'What is your sex?',
    description: 'Skip anything you prefer not to share.',
    options: ['Female', 'Male', 'Intersex', 'Prefer not to say'],
    optional: true,
  },
  {
    id: 'height',
    section: 'A little more about you',
    title: 'How tall are you?',
    description:
      'Only share this if you’re comfortable. You can choose your units.',
    type: 'number',
    ranges: { in: [36, 96], cm: [90, 245] },
    placeholder: 'Your height',
    units: ['in', 'cm'],
    optional: true,
  },
  {
    id: 'weight',
    section: 'A little more about you',
    title: 'What’s your current weight?',
    description: 'One last optional detail for your profile.',
    type: 'number',
    ranges: { lb: [60, 700], kg: [27, 320] },
    placeholder: 'Your weight',
    units: ['lb', 'kg'],
    optional: true,
  },
]

export function Onboarding({ user }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [units, setUnits] = useState({ height: 'cm', weight: 'lb' })
  const [details, setDetails] = useState({})
  const [error, setError] = useState('')
  const [finished, setFinished] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [warned, setWarned] = useState('')
  const heading = useRef(null)
  const q = questions[step]
  const value = answers[q.id] ?? (q.multi ? [] : '')
  const progress = finished ? 100 : Math.round((step / questions.length) * 100)
  const needsDetail =
    q.extra &&
    (Array.isArray(value)
      ? value.includes('Other')
      : value === 'Something else')

  function move(next) {
    setError('')
    setStep(next)
    requestAnimationFrame(() => heading.current?.focus())
  }

  function submit(event) {
    event.preventDefault()
    const [min, max] = q.ranges ? q.ranges[units[q.id]] : [q.min, q.max]
    const unit = q.ranges ? ` ${units[q.id]}` : ''
    if (
      (!q.optional &&
        !(Array.isArray(value) ? value.length : value.trim().length)) ||
      (q.type === 'number' &&
        value !== '' &&
        (!Number.isFinite(Number(value)) ||
          Number(value) < min ||
          Number(value) > max))
    ) {
      setError(
        q.type === 'number'
          ? `Enter a number between ${min} and ${max}${unit}, or skip this question.`
          : 'Please add an answer to keep going.',
      )
      return
    }
    if (q.id === 'weight' && value !== '' && answers.height) {
      const kg = units.weight === 'lb' ? Number(value) * 0.4536 : Number(value)
      const m =
        units.height === 'in'
          ? Number(answers.height) * 0.0254
          : Number(answers.height) / 100
      const bmi = kg / (m * m)
      if ((bmi < 12 || bmi > 90) && warned !== value + units.weight) {
        setError('Confirm your weight')
        setWarned(value + units.weight)
        return
      }
    }
    if (needsDetail && !details[q.id]?.trim()) {
      setError('Tell us a little more in the field below.')
      return
    }
    if (editing || step === questions.length - 1) {
      setFinished(true)
      setEditing(false)
    } else move(step + 1)
  }

  function select(option) {
    setError('')
    if (!q.multi) setAnswers({ ...answers, [q.id]: option })
    else
      setAnswers({
        ...answers,
        [q.id]:
          option === 'None'
            ? value.includes('None')
              ? []
              : ['None']
            : value.includes(option)
              ? value.filter((item) => item !== option)
              : [...value.filter((item) => item !== 'None'), option],
      })
  }

  if(confirmed){
    return <Dashboard answers={answers} user={user}/>;
  }

  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="/" aria-label="GroceryBuddy home">
          <span className="brand-mark">
            g<span>✳</span>
          </span>
          grocerybuddy<span className="brand-dot">.</span>
        </a>
      </header>
      <main>
        <aside className="story-panel">
          <h1>
            A full cart.
            <br />A little less
            <br />
            <em>on your plate.</em>
          </h1>
          <div className="grocery-art" aria-hidden="true">
            <span className="art-orbit" />
            <span className="leaf leaf-one" />
            <span className="leaf leaf-two" />
            <span className="carrot">🥕</span>
            <span className="bag">
              <span className="bag-handle" />
              <span className="bag-word">
                the good
                <br />
                stuff.
              </span>
              <span className="bag-star">✳</span>
            </span>
            <span className="tomato">🍅</span>
          </div>
        </aside>
        <section className="quiz-panel" aria-label="GroceryBuddy onboarding">
          <nav className="step-nav" aria-label="Question navigation">
            <button
              type="button"
              disabled={step === 0 && !finished}
              aria-label="Previous question"
              onClick={() => {
                if (finished) {
                  setFinished(false)
                  move(questions.length - 1)
                } else move(step - 1)
              }}
            >
              ←
            </button>
            <button
              type="button"
              disabled={finished}
              aria-label="Next question"
              onClick={submit}
            >
              →
            </button>
          </nav>
          <div className="progress-meta">
            <span>
              {finished
                ? 'All done!'
                : step === 0
                  ? 'Let’s get started'
                  : `Nice! ${step} of ${questions.length} answered`}
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
          {finished ? (
            <div className="completion">
              <div className="eyebrow">
                NICE TO MEET YOU,{' '}
                {String(answers.name || 'FRIEND').toUpperCase()}
              </div>
              <h2>
                Your next grocery run
                <br />
                starts with you.
              </h2>
              <p>
                Here’s your profile. You can always adjust any answer in the
                dashboard.
              </p>
              <dl>
                {questions.map((item, index) => (
                  <div key={item.id}>
                    <dt>
                      {item.id.charAt(0).toUpperCase() + item.id.slice(1)}
                    </dt>
                    <dd>
                      <button
                        className="review-answer"
                        aria-label={`Edit ${item.id}`}
                        onClick={() => {
                          setFinished(false)
                          setConfirmed(false)
                          setEditing(true)
                          move(index)
                        }}
                      >
                        {answers[item.id]?.length ? (
                          <>
                            {Array.isArray(answers[item.id])
                              ? answers[item.id].join(', ')
                              : answers[item.id]}
                            {units[item.id] ? ` ${units[item.id]}` : ''}
                            {details[item.id] &&
                            (answers[item.id] === 'Something else' ||
                              (Array.isArray(answers[item.id]) &&
                                answers[item.id].includes('Other')))
                              ? ` — ${details[item.id]}`
                              : ''}
                          </>
                        ) : (
                          'Not provided'
                        )}
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
              {!confirmed && (
                <button className="primary" onClick={() => setConfirmed(true)}>
                  Confirm my answers
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="question" key={q.id} noValidate>
              <div className="question-kicker">
                <span>{String(step + 1).padStart(2, '0')}</span>
                {q.section}
                <span className="optional">{q.optional ? 'Optional' : ''}</span>
              </div>
              <h2 ref={heading} tabIndex={-1}>
                {q.title}
              </h2>
              <p className="description">{q.description}</p>
              {q.options ? (
                <fieldset>
                  <legend className="sr-only">{q.title}</legend>
                  {q.options.map((option, index) => (
                    <label
                      key={option}
                      className={`choice ${value.includes(option) ? 'selected' : ''}`}
                    >
                      <input
                        type={q.multi ? 'checkbox' : 'radio'}
                        name={q.id}
                        checked={
                          q.multi ? value.includes(option) : value === option
                        }
                        onChange={() => select(option)}
                      />
                      <span className="choice-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                      <span className="choice-check">
                        {(q.multi ? value.includes(option) : value === option)
                          ? '✓'
                          : ''}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <div className="input-row">
                  <input
                    aria-label={q.title}
                    type={q.type || 'text'}
                    min={q.min}
                    max={q.max}
                    step="any"
                    autoComplete={q.id === 'name' ? 'given-name' : 'off'}
                    placeholder={q.placeholder}
                    value={value}
                    onChange={(event) => {
                      setAnswers({ ...answers, [q.id]: event.target.value })
                      setError('')
                    }}
                  />
                  {q.units ? (
                    <div
                      className="unit-toggle"
                      role="group"
                      aria-label={`${q.id} units`}
                    >
                      {q.units.map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          className={units[q.id] === unit ? 'active' : ''}
                          aria-pressed={units[q.id] === unit}
                          onClick={() => setUnits({ ...units, [q.id]: unit })}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  ) : q.unit ? (
                    <span>{q.unit}</span>
                  ) : null}
                </div>
              )}
              {needsDetail && (
                <input
                  className="detail-input"
                  aria-label="Additional dietary details"
                  placeholder="Tell us more…"
                  value={details[q.id] || ''}
                  onChange={(event) =>
                    setDetails({ ...details, [q.id]: event.target.value })
                  }
                />
              )}
              <div className="error" role="alert">
                {error}
              </div>
              <div className="actions">
                <button className="primary" type="submit">
                  {editing
                    ? 'Save answer'
                    : step === questions.length - 1
                      ? 'Finish'
                      : 'Continue'}{' '}
                </button>
                <span className="enter-hint">
                  or press <strong>Enter ↵</strong>
                </span>
                {q.optional && (
                  <button
                    className="skip"
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, [q.id]: '' })
                      if (editing || step === questions.length - 1) {
                        setFinished(true)
                        setEditing(false)
                      } else move(step + 1)
                    }}
                  >
                    Skip
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}

function Dashboard ({answers, user}){
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const displayName = user?.username || user?.first_name || answers.name || 'Friend'
  const firstLetter = displayName.charAt(0).toUpperCase()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false)
  useEffect(() => {
    let active = true
    if (!user) return () => { active = false }
    api('inventory/items/').then(data => { if (active) setItems(data) })
      .catch(error => { if (active) setError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])
  async function handleSaveItem(item) {
    const saved = await api('inventory/items/', { method: 'POST', body: item })
    setItems(previous => [...previous, saved])
  }
  async function handleUpdateItem(item) {
    const saved = await api(`inventory/items/${item.id}/`, { method: 'PATCH', body: item })
    setItems(previous => previous.map(existing => existing.id === saved.id ? saved : existing))
    setEditingItem(null)
  }
  async function handleDeleteItem(item) {
    if (!window.confirm(`Delete ${item.name}?`)) return
    setDeletingId(item.id)
    setError('')
    try {
      await api(`inventory/items/${item.id}/`, { method: 'DELETE' })
      setItems(previous => previous.filter(existing => existing.id !== item.id))
      if (editingItem?.id === item.id) setEditingItem(null)
    } catch (error) { setError(error.message) }
    finally { setDeletingId(null) }
  }
  const [currentView, setCurrentView] = useState('Dashboard')
  if (currentView === 'Recipes') return <RecipesPage items={items} onBackToDashboard={() => setCurrentView('Dashboard')} answers={answers} />
  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="/" aria-label="GroceryBuddy home">
          <span className="brand-mark">
            g<span>✳</span>
          </span>
          grocerybuddy<span className="brand-dot">.</span>
        </a>
        <div className="profile-dropdown-container">
       
        <button className="profile-button">
          <span className="profile-initial">{firstLetter}.</span>
          <span className="profile-fullname">{displayName}</span>
        </button>
        <div className="dropdown-menu">
          <a href="#profile" className="dropdown-item">Your Profile</a>
          <a href="#settings" className="dropdown-item">Get Help</a>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item danger">Sign out</button>
        </div>
        </div>
      </header>
      <div>
        <h1 className="user-welcome">Welcome to Your Dashboard {answers.name}!</h1>
      </div>
      <div className="dashboard-layout">
          <div className="fridge-card">
            <h2 className="fridge-title">My Fridge</h2>
            {!user && <p role="status">Sign-in is required to load and save groceries. The login screen is coming soon.</p>}
            {user && loading && <p role="status">Loading groceries…</p>}
            {error && <p role="alert">{error}</p>}
            {user && !loading && !error && items.length === 0 ? (
              <p className="empty-text">Your Fridge is Empty</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id} className="fridge-item">
                    <div className="grocery-details">
                      <strong>{item.name}</strong>
                      <span>Quantity: {item.quantity} · {item.category} · {item.storage_location}</span>
                      <span>Purchased: {item.purchase_date} · Expires: {item.expiration_date || 'Not set'}</span>
                    </div>
                    <div className="grocery-actions">
                      <button type="button" disabled={deletingId === item.id} onClick={() => setEditingItem(item)}>Edit {item.name}</button>
                      <button type="button" disabled={deletingId !== null} onClick={() => handleDeleteItem(item)}>{deletingId === item.id ? 'Deleting…' : `Delete ${item.name}`}</button>
                    </div>
                  </li>
                ))}
              </ul>
            )
            }

            {editingItem && <GroceryEditor key={editingItem.id} item={editingItem} onSave={handleUpdateItem} onCancel={() => setEditingItem(null)} />}
            <button
            type="button"
            className="add-button"
            disabled={!user}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true)}}
            >
              <span className="plus-icon">+</span>
              <span>Add Items</span>
            </button>
            {isModalOpen && (
              <AddFoodModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSaveItem={handleSaveItem}
              />
            )}
            
          </div>


          <div className="dashboard-right">
            <button
            type="button"
            className="recipes-button"
            onClick={() => setCurrentView('Recipes')}
            >
              <span className="recipes-button-title">Get Recipes</span>
              <span className="recipe-button-description">Let us generate some recipes for you</span>
            </button>
            


            <button
            type="button"
            className="shoppinglist-button"
            onClick={(e) => {
              e.stopPropagation();
              setIsShoppingModalOpen(true);
            }}
            >
              <span className="shoppinglist-button-title">Generate a Shopping List</span>
              <span className="shoppinglist-button-description">We'll create a list for all of the foods you love!</span>
            </button>

            <ShoppingListModal
            isOpen={isShoppingModalOpen}
            onClose={() => setIsShoppingModalOpen(false)}
            onGenerateList={() => {

            }}
            />
            
            <button
            type="button"
            className="waste-button"
            onClick={() => alert("Prior Wastes Clicked")}
            >
              <span className="waste-button-title">Check Your Prior Wastes</span>
              <span className="waste-button-description">Keep track of what you're not eating</span>
            </button>
          </div>
      </div>
    </div>
    )}

const GROCERY_CATEGORIES = ['Fruit', 'Vegetable', 'Grain', 'Protein', 'Dairy', 'Eggs', 'Seafood', 'Beverage', 'Meat', 'Bread', 'Pantry']

function localDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function GroceryEditor({item, onSave, onCancel}) {
  const [draft, setDraft] = useState(item)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  function change(event) {
    const {name, value} = event.target
    setDraft(previous => ({...previous, [name]: name === 'quantity' ? Number(value) : value}))
  }
  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try { await onSave({...draft, expiration_date: draft.expiration_date || null}) }
    catch (error) { setError(error.message) }
    finally { setSaving(false) }
  }
  return <form className="grocery-editor" onSubmit={submit} aria-label={`Edit ${item.name}`}>
    <fieldset disabled={saving}>
      <legend>Edit grocery item</legend>
      <label>Name<input name="name" value={draft.name} maxLength={100} required onChange={change} /></label>
      <label>Quantity<input name="quantity" type="number" min="0" step="1" required value={draft.quantity} onChange={change} /></label>
      <label>Category<select name="category" value={draft.category} onChange={change}>{GROCERY_CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Storage<select name="storage_location" value={draft.storage_location} onChange={change}>{['fridge', 'freezer', 'pantry'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Purchase date<input name="purchase_date" type="date" required value={draft.purchase_date} onChange={change} /></label>
      <label>Expiration date<input name="expiration_date" type="date" value={draft.expiration_date || ''} onChange={change} /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">{saving ? 'Saving…' : 'Save changes'}</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </fieldset>
  </form>
}

function AddFoodModal({isOpen, onClose, onSaveItem}){

  const [query, setQuery] = useState('');
  const [activeFoodItem, setActiveFoodItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [storage, setStorage] = useState('fridge');
  const [purchaseDate, setPurchaseDate] = useState(() => localDate());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [category, setCategory] = useState('Pantry');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !activeFoodItem) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, activeFoodItem]);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setActiveFoodItem(null);
    setQuery('');
    onClose();
  };

  const handleSelectFood = (foodName) => {
    if (!foodName.trim()) return;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setSelectedDate(defaultDate.toISOString().split('T')[0]);
    setQuantity(1);
    setSaveError('');
    setActiveFoodItem({ name: foodName.trim() });
  };

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await onSaveItem({ name: activeFoodItem.name, quantity, category, purchase_date: purchaseDate, storage_location: storage, expiration_date: selectedDate || null })
      resetAndClose()
    } catch (error) { setSaveError(error.message) }
    finally { setSaving(false) }
  };

  return(
    <div className="add-food-backdrop" onClick={resetAndClose}>
      <div className="add-food-content" onClick={(e) => e.stopPropagation()}>
        

        <button className="add-food-close-button" onClick={resetAndClose}>
          ✕
        </button>

    
        {!activeFoodItem ? (
          <div>
            <div className="add-food-header">
              <h2 className="add-food-item-title" style={{ textAlign: 'left', margin: 0 }}>
                Add Food Item
              </h2>
            </div>

            <div className="add-food-search-box">
              <input
                ref={inputRef}
                type="text"
                className="add-food-input"
                placeholder="Type any food item..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectFood(query)}
              />
            </div>

            {query.trim() && (
              <div className="add-food-custom-action">
                <button 
                  className="add-food-custom-button" 
                  onClick={() => handleSelectFood(query)}
                >
                  <span>Add item: <strong>"{query}"</strong></span>
                  <span className="add-food-enter-hint">Press ↵</span>
                </button>
              </div>
            )}
          </div>
        ) : (

          <div className="add-food-detail">
            <div className="add-food-header">
              <button 
                onClick={() => setActiveFoodItem(null)} 
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}
              >
                ← Back
              </button>
            </div>

            <div>
              <h3 className="add-food-item-title">{activeFoodItem.name}</h3>
            </div>

       
            <div className="add-food-group">
              <label className="add-food-field-label">Quantity</label>
              <div className="add-food-qty-wrapper">
                <button 
                  className="add-food-qty-button" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="add-food-qty-val">{quantity}</span>
                <button 
                  className="add-food-qty-button" 
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

              <div className="add-food-group">
                <label className="add-food-field-label">Food Category</label>
                <div className="category-container">
                  {GROCERY_CATEGORIES.map((cat) =>{
                    const isSelected = category === cat;
                    return(
                      <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`category-pill ${isSelected ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

   
            <div className="add-food-group">
                              <label className="add-food-field-label" htmlFor="food-storage">Storage</label>
                <select id="food-storage" value={storage} onChange={e => setStorage(e.target.value)}>
                  {['fridge', 'freezer', 'pantry'].map(value => <option key={value}>{value}</option>)}
                </select>
                <label className="add-food-field-label" htmlFor="food-purchase">Purchase date</label>
                <input id="food-purchase" type="date" required value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>

            <div className="add-food-group">
              <label className="add-food-field-label">
                Expiration Date (optional)
              </label>
              <input
                type="date"
                className="add-food-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {saveError && <p role="alert">{saveError}</p>}
            <div className="add-food-footer">
              <button 
                className="add-food-button add-food-button-secondary" 
                onClick={() => setActiveFoodItem(null)}
              >
                Cancel
              </button>
              <button 
                className="add-food-button add-food-button-primary" 
                disabled={saving || !purchaseDate} onClick={handleSave}
              >
                {saving ? 'Saving…' : 'Save Item'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function ShoppingListModal({ isOpen, onClose, onGenerateList}){
  
  const[budget, setBudget] = useState(50);
  const resetAndClose = () => {
    onClose();
  };

  if(!isOpen) return null;

  const handleGenerate = () => {
    const listConfig = {
      budget: Number(budget)
    };
    if(onGenerateList) onGenerateList(listConfig);
    onClose();
  };

  return (
    
    <div className="add-food-backdrop" onClick={onClose}>
      <div className="add-food-content" onClick={(e) => e.stopPropagation()}>
        <button className="add-food-close-button" onClick={resetAndClose}>
          ✕
        </button>

        <div className="add-food-header">
          <h2 className="add-food-item-title" style={{ textAlign: 'left', marin: 0}}>Generate Shopping List</h2>
        </div>

        <div className="add-food-group" style={{ marginTop: '16px'}} onClick={(e) => e.stopPropagation()}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <label className="add-food-field-label" style={{ margin: 0}}>Target Budget</label>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#a3be8c', fontFamily: 'monospace' }}>
              ${budget}
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={{
              width: '100%',
              accentColor: '#388e55',
              cursor: 'pointer',
              margin: '8px 0'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            <span>$10</span>
            <span>$100</span>
            <span>$200+</span>
          </div>
          
        </div>

        <div className="add-food-group" style={{ marginTop: '20px' }}>
          <label className="add-food-field-label">Generated List Preview</label>
          <div className="generated-preview-container">
            <span className="preview-placeholder-text">Click generate for shopping list preview</span>
          </div>
        </div>

        <div className="add-food-footer" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="add-food-button add-food-button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="add-food-button add-food-button-primary"
            onClick={handleGenerate}
          >
            Generate List
          </button>
        </div>
      </div>
    </div>
  )
}

function RecipesPage({items, onBackToDashboard, answers}){
  const firstLetter = answers?.name ? answers.name.charAt(0).toUpperCase() : 'Y';
  const[recipes] = useState([
    {
      id: 1,
      title: 'Garlic Butter Chicken and Broccoli',
      prepTime: '25 mins',
      description: 'A quick chicken breast recipe tossed with broccoli and garlic',
      totalIngredients: 4,
      matchCount: 4,
      saved: true,
      usesExpiringItem:true,
      ingredients: [
        {name: 'Chicken Breast', inFridge:true},
        {name: 'Broccoli', inFridge: true},
        {name: 'Garlic', inFridge: true},
        {name: 'Butter', inFridge: true}
      ],
      instructions: [
        'Pat the chicken dry and season with salt, pepper, onion power, garlic powder, and paprika.',
        'Melt butter in a skiller over medium high heat and sear the chicken for 7 minutes per sode until golden.',
        'Add in your garlic and your broccoli florets to the pan, add a little water then cover for 4 minutes.',
        'Toss everything together in the garlic butter sauce and serve.'
      ]
    },
    {
      id: 2,
      title: 'Creamy Lemon Chicken Orzo',
      prepTime: '25 mins',
      description: 'A delicious and filling orzo pasta recipe, quick and easy!',
      totalIngredients: 8,
      matchCount: 7,
      saved: true,
      usesExpiringItem:true,
      ingredients: [
        {name: 'Chicken Breast', inFridge:true},
        {name: 'Garlic', inFridge: true},
        {name: 'Orzo', inFridge: false},
        {name: 'Chicken Stock', inFridge: true},
        {name: 'Lemon', inFridge:true},
        {name: 'Parmesan', inFridge:true},
        {name: 'Spinach', inFridge:true},
        {name: 'Heavy Cream', inFridge:true}
      ],
      instructions: [
        'Fry the chicken pieces in hot oil over medium heat.',
        'Add the orzo, chicken stock, lemon zest, salt, pepper, and other seasonings (as you like) to a pot.',
        'Turn down your heat and add in the spinach, cream, and lemon juice. Stir until the spinach wilts and cream has been heated.',
        'Turn your heat off and mix in your parmesean cheese'
      ]
    }
  ]);

  const[isLoading, setIsLoading] = useState(false);
  const[error, setError] = useState(null);
  const[savedFilterActive] = useState(false);
  const[isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const[selectedRecipe, setSelectedRecipe] = useState(null);
  const[activeFilters, setActiveFilters] = useState({
    cookNowOnly: false,
    useSoonOnly:false,
    maxTime: 'all'
  });
  const[, setShoppingList] = useState([]);

  

  const handleGenerateAiRecipes = async() => {
    setIsLoading(true);
    setError(null);

    //ai code here
  };

  const addMissingToShoppingList = (ingredients) => {
    const missing = ingredients.filter(i => !i.inFridge).map(i => i.name);
    setShoppingList(prev => [...new Set([...prev, ...missing])]);
    alert('Missing ingredients added to your shopping list');
  };

  const inventoryRecipes = recipes.map(recipe => {
    const ingredients = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      inFridge: items.some(item => item.quantity > 0 && item.name.toLowerCase() === ingredient.name.toLowerCase()),
    }))
    return { ...recipe, ingredients, matchCount: ingredients.filter(ingredient => ingredient.inFridge).length }
  })
  const filteredRecipes = inventoryRecipes.filter(recipe => {
    if(savedFilterActive && !recipe.saved)return false;
    if(activeFilters.cookNowOnly && recipe.matchCount < recipe.totalIngredients) return false;
    if(activeFilters.useSoonOnly && !recipe.usesExpiringItem) return false;
    return true;
  });

  return(
    <div className="recipes-page">
      {onBackToDashboard && (
        <div className="recipes-back-container">
          <button onClick={onBackToDashboard} className="recipe-back-button">
          &larr; Back to Dashboard
          </button>
        </div>
      )}
      <header>
        <a className="brand" href="/" aria-label="GroceryBuddy home">
          <span className="brand-mark">
            g<span>✳</span>
          </span>
          grocerybuddy<span className="brand-dot">.</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto'}}>

          <button
          onClick={() => setIsFilterModalOpen(true)}
          className="recipe-button-2 recipe-button-2-light"
          >⚙️</button>
        </div>
        <div className="profile-dropdown-container">
       
        <button className="profile-button">
          <span className="profile-initial">{firstLetter}.</span>
          <span className="profile-fullname">{answers?.name || 'You'}</span>
        </button>
        <div className="dropdown-menu">
          <a href="#profile" className="dropdown-item">Your Profile</a>
          <a href="#settings" className="dropdown-item">Get Help</a>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item danger">Sign out</button>
        </div>
        </div>
      </header>

      <div className="spotlight-banner">
        <div className="spotlight-info">
          <div className="spotlight-text">
          <h4>AI Recipe Generator</h4>
          <p>Create custom meals based on your fridge items.</p>
          </div>
        </div>
        <button
        onClick={handleGenerateAiRecipes}
        disabled={isLoading}
        className="recipe-button-2 recipe-button-2-primary"
        style={{ fontSize: '0.8rem', padding: '6px 12px'}}
        >
          {isLoading ? 'Generating...' : 'Generate Recipes'}
        </button>
      </div>

      {error && (
        <div style={{padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '20px'}}
        >
          {error}
        </div>
      )}

      {isLoading && (
        <div className="recipes-grip">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      )}

      {!isLoading && recipes.length === 0 && (
        <div className="empty-state">
            <span style={{fontSize: '2rem', display: 'block', marginBottom: '8px'}}></span>
            <h3 style={{fontSize: '1rem', fontWeight: 600, margin: '0 0 4px 0', color: '#1b4332'}}>No recipes generate yet</h3>
            <p style={{fontSize: '0.85rem', color: '#6b7280', margin: 0}}>Click "Generate Recipes" to let the AI suggest some meals.</p>
        </div>
      )}

      {!isLoading && filteredRecipes.length > 0 && (
        <div className="recipes-grid">
          {filteredRecipes.map((recipe) => {
            const missingCount = recipe.totalIngredients - recipe.matchCount;
            return (
              <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="recipe-card"
              >
                <div>
                  <div className="card-header">
                  <h3 className="card-title">{recipe.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280'}}>{recipe.prepTime}</span>
                  </div>
                  <p className="ingredient-summary" style={{ display: '-webkit-box',WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {recipe.description}
                  </p>
                </div>

                <div className="card-footer">
                  <span className={`badge ${missingCount === 0 ? 'badge-green' : 'badge-orange'}`}>
                    {missingCount === 0 ? 'All in fridge' : `Missing ${missingCount}`}
                  </span>
                  <span style={{fontSize: '0.8rem', fontWeight: 500, color: '#e65100' }}>
                  View &rarr;
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      )}

      {isFilterModalOpen && (
          <div className="recipe-modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
            <div className="recipe-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="recipe-modal-header">
                <h3 style={{margin: 0, fontSize: '1.1rem', color: '#1b4332'}}>Filter Recipes</h3>
                <button className="recipe-modal-close" onClick={() => setIsFilterModalOpen(false)}>&times;</button>
              </div>

              <div className="filter-group">
                <label>
                  <input
                  type="checkbox"
                  checked={activeFilters.cookNowOnly}
                  onChange={(e) => setActiveFilters({...activeFilters,cookNowOnly: e.target.checked})}
                  style={{marginRight: '8px'}}
                  />
                  <span>Cook Now (100% Fridge Match)</span>
                </label>
                <label>
                  <input
                  type="checkbox"
                  checked={activeFilters.useSoonOnly}
                  onChange={(e) => setActiveFilters({...activeFilters, useSoonOnly: e.target.checked})}
                  style={{marginRight: '8px'}}
                  />
                  <span>Uses Expiring Ingredients</span>
                </label>
              </div>

            </div>
          </div>
      )}

      {selectedRecipe && (
        <div className="recipe-modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="recipe-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-modal-header" style={{alignItems: 'flex-start'}}>
              <div>
                <span style={{fontSize: '0.8rem', color: '#6b7280'}}>{selectedRecipe.prepTime}</span>
                <h2 style={{fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0', color: '#1b4332'}}>{selectedRecipe.title}</h2>
              </div>
              <button className="recipe-modal-close" onClick={() => setSelectedRecipe(null)}>&times;</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '20px' }}>{selectedRecipe.description}</p>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: '#1b4332' }}>Ingredients</h4>
                {selectedRecipe.ingredients?.some(i => !i.inFridge) && (
                  <button
                  onClick={() => addMissingToShoppingList(selectedRecipe.ingredients)}
                  style={{background: 'none', border: 'none', color: '#46643b', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer'}}
                  >
                    + Add missing to shopping list
                  </button>
                )}
            </div>

            <ul style={{ listStyle: 'none', padding: '12px', margin: 0, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              {selectedRecipe.ingredients?.map((ing, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: ing.inFridge ? '#1f2937' : '#dc2626', fontWeight: ing.inFridge ? 400 : 500 }}>
                    {ing.inFridge ? '✓ ' : 'x '}{ing.name}
                  </span>
                  <span style = {{fontSize: '0.75rem', color: ing.inFridge ? '#1b4332' : '#e65100', fontWeight: 600}}>
                    {ing.inFridge ? 'In Fridge' : "Need to buy"}
                  </span>
                </li>
              ))}
            </ul>
            </div>
              
              <div style={{marginBottom: '24px'}}>
              <h4 style={{fontSize: '0.9rem', fontWeight: 600, margin: '0 0 8px 0', color: '#1b4332'}}>Instructions</h4>
              <ol style={{paddingLeft: '20px', fontSize: '0.85rem', color: '#374161', lineHeight: 1.5, margin: 0}}>
                {selectedRecipe.instructions?.map((step,idx) => (
                  <li key={idx} style={{marginBottom: '6px'}}>{step}</li>
                ))}
              </ol>
              </div>

              <button
              onClick={() => {
                alert('To record ingredients used, update their quantities in your grocery inventory.');
                setSelectedRecipe(null);
              }}
              className="recipe-button-2 recipe-button-2-primary"
              style={{width: '100%'}}
              > Mark as Cooked</button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api('accounts/session/').then(data => { if (active) setUser(data.user) })
      .catch(() => { if (active) setError('Could not connect to your grocery account. Please try again later.') })
      .finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])
  if (!ready) return <p role="status">Loading GroceryBuddy…</p>
  return <>
    {error && <p role="alert">{error}</p>}
    <Onboarding user={user} />
  </>
}

export default App
