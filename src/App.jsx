import { useRef, useState, useEffect } from 'react'
import './App.css'


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

function App() {
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
    return <Dashboard answers={answers}/>;
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

function Dashboard ({answers}){

  const [fridgeItems, setFridgeItems] = useState([]);
  const firstLetter = answers?.name ? answers.name.charAt(0).toUpperCase() : '';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [pantryItems, setPantryItems] = useState([]);

  

  const handleAdditions = () => {
    const newItem = prompt("Enter Your Fridge Items Here!");
    if(newItem && newItem.trim() !== ""){
      setFridgeItems([...fridgeItems,newItem]);
    }
  };

  const handleSaveItem = (newItem) => {
    setPantryItems((prev) => [...prev, newItem]);
  };
  
  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="/" aria-label="GroceryBuddy home">
          <span className="brand-mark">
            g<span>✳</span>
          </span>
          grocerybuddy<span className="brand-dot">.</span>
        </a>
        <button className="profile-button">
          <span className="profile-initial">{firstLetter}.</span>
          <span className="profile-fullname">{answers.name}</span>
        </button>
  
      </header>
      <div>
        <h1 className="user-welcome">Welcome to Your Dashboard {answers.name}!</h1>
      </div>
      <div classname="dashboard-layout">
          <div className="fridge-card" onClick={() => alert("Fridge Clicked")}>
            <h2 className="fridge-title">My Fridge</h2>
            {fridgeItems.length === 0 ? (
              <p className="empty-text">Your Fridge is Empty</p>
            ) : (
              <ul>
                {fridgeItems.map((item,index) => (
                  <li key={index} className="fridge-item">
                    {item}
                  </li>
                ))}
              </ul>
            )
            }

            <button
            type="button"
            className="add-button"
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
              onSaveItem={(newItem) => {

              }}
              />
            )}
            
          </div>


          <div className="dashboard-right">
            <button
            type="button"
            className="recipes-button"
            onClick={() => alert("Recipes Button Clicked")}
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
            onGenerateList={(config) => {

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

function AddFoodModal({isOpen, onClose, onSaveItem}){

  const [query, setQuery] = useState('');
  const [activeFoodItem, setActiveFoodItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [dateType, setDateType] = useState('bestBy');
  const [selectedDate, setSelectedDate] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeFoodItem) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setSelectedDate(defaultDate.toISOString().split('T')[0]);
      setQuantity(1);
    }
  }, [activeFoodItem]);

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
    setActiveFoodItem({ name: foodName.trim() });
  };

  const handleSave = () => {
    const itemData = {
      name: activeFoodItem.name,
      quantity,
      dateType,
      date: selectedDate,
    };
    if (onSaveItem) onSaveItem(itemData);
    resetAndClose();
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
              <label className="add-food-field-label">Date Type</label>
              <div className="add-food-toggle">
                <button
                  type="button"
                  className={`add-food-toggle-button ${dateType === 'bestBy' ? 'active' : ''}`}
                  onClick={() => setDateType('bestBy')}
                >
                  Best By Date
                </button>
                <button
                  type="button"
                  className={`add-food-toggle-button ${dateType === 'expiration' ? 'active' : ''}`}
                  onClick={() => setDateType('expiration')}
                >
                  Expiration Date
                </button>
              </div>
            </div>

  
            <div className="add-food-group">
              <label className="add-food-field-label">
                {dateType === 'bestBy' ? 'Best By Date' : 'Expiration Date'}
              </label>
              <input
                type="date"
                className="add-food-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="add-food-footer">
              <button 
                className="add-food-button add-food-button-secondary" 
                onClick={() => setActiveFoodItem(null)}
              >
                Cancel
              </button>
              <button 
                className="add-food-button add-food-button-primary" 
                onClick={handleSave}
              >
                Save Item
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

const getHighBudget = (budgetVal) => {
  if (!budgetVal) return 0;
  if (typeof budgetVal === 'number') return budgetVal;
  if (Array.isArray(budgetVal)) return Math.max(...budgetVal);
  if (typeof budgetVal === 'string') {
    const numbers = budgetVal.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return parseFloat(numbers[numbers.length - 1]);
    }
  }
  return 0;
};

function ShoppingListModal({ isOpen, onClose, onGenerateList, answers}){
  
  const[budget, setBudget] = useState(50);
  const resetAndClose = () => {
    setActiveFoodItem(null);
    setQuery('');
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
      <div className="add-food-content" onClick={(e) => e.stopPropagation}>
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

export default App
