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
  const[currentView, setCurrentView] = useState('Dashboard')
  
 
  if(currentView === 'Recipes'){
    return(
      <RecipesPage
      fridgeItems={fridgeItems}
      onBackToDashboard={() => setCurrentView('Dashboard')}
      />
    );
  }

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
        <div className="profile-dropdown-container">
       
        <button className="profile-button">
          <span className="profile-initial">{firstLetter}.</span>
          <span className="profile-fullname">{answers.name}</span>
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
      <div classname="dashboard-layout">
          <div className="fridge-card">
            <h2 className="fridge-title">My Fridge</h2>

            {fridgeItems.length === 0 ? (
              <p className="empty-text">Your Fridge is Empty</p>
            ) : (
              <ul>
                {fridgeItems.map((item) => {
                  const foodStatus = getFoodStatus(item.date);

                  return (
                    <li key={item.id} className="fridge-item">
                     
                      <span className="fridge-item-name">
                        {item.name}
                        <span className="fridge-category-emoji">
                          {item.category?.split(' ').pop()}
                        </span>
                      </span>
                       

                       <div className="fridge-item-bottom">
                      <span className="fridge-quantity">
                        x {item.quantity}
                      </span>
                    
                     <span className={`food-status-tag ${foodStatus.status}`}>
                      {foodStatus.statusLabel}
                     </span>
                     </div>
                    </li>
                  );
                })}
              </ul>
            )
            }

            <button
            type="button"
            className="add-button"
            onClick={() => {
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
                setFridgeItems((prevItems) => [...prevItems,newItem]);
              }}
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

function getFoodStatus(dateString){
  if(!dateString){
    return{
      status: 'unknown',
      statusLabel: 'Date not set'
    };
  }

  const today = new Date();
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [year, month, day] = dateString.split('-').map(Number);
  const selectedUTC = Date.UTC(year, month - 1, day);
  const daysUntilDate = Math.round(
    (selectedUTC - todayUTC) / (1000 * 60 * 60 * 24)
  );

  if(daysUntilDate < 0){
    return { status: 'past-date', statusLabel: 'Past estimated date' };
  }

  if(daysUntilDate === 0){
    return {status: 'use-today', statusLabel: 'Use today' };
  }

  if(daysUntilDate <= 3){
    return {status: 'use-soon', statusLabel: 'Use soon' };
  }

  return {status: 'still-good', statusLabel: 'Still good'};

}

function AddFoodModal({isOpen, onClose, onSaveItem}){

  const [query, setQuery] = useState('');
  const [activeFoodItem, setActiveFoodItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [dateType, setDateType] = useState('bestBy');
  const [selectedDate, setSelectedDate] = useState('');
  const [category, setCategory] = useState('Other');
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
      name: activeFoodItem.name.trim().toLowerCase(),
      quantity,
      dateType,
      date: selectedDate,
      category,
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
                <label className="add-food-field-label">Food Category</label>
                <div className="category-container">
                  {['Produce 🍎', 'Dairy 🥛', 'Meat 🍖', 'Pantry 🍪', 'Other 🍱'].map((cat) =>{
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

function RecipesPage({fridgeItems, onBackToDashboard, answers}){
  const firstLetter = answers?.name ? answers.name.charAt(0).toUpperCase() : 'Y';
  const[recipes, setRecipes] = useState([
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
  const[savedFilterActive, setSavedFilterActive] = useState(false);
  const[isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const[selectedRecipe, setSelectedRecipe] = useState(null);
  const[activeFilters, setActiveFilters] = useState({
    cookNowOnly: false,
    useSoonOnly:false,
    maxTime: 'all'
  });
  const[shoppingList, setShoppingList] = useState([]);

  

  const handleGenerateAiRecipes = async() => {
    setIsLoading(true);
    setError(null);
    
    try{
      if(!fridgeItems?.length){
        setError('Add some ingredients to your fridge before generating recipes.');
      } 
      } catch (err){
        setError('Something went wrong while generating recipes.');
    } finally {
      setIsLoading(false);
    }
    //ai code here
  };

  const toggleSaved = (recipeId) =>{
    setRecipes((prev) =>
    prev.map((recipe) =>
      recipe.id === recipeId
    ? {...recipe, saved: !recipe.saved}
    : recipe
    )
  );

  setSelectedRecipe((prev) => 
  prev?.id === recipeId
    ? {...prev, saved: !prev.saved}
    : prev
  );
  };

  const addMissingToShoppingList = (ingredients) => {
    const missing = ingredients
    .filter((ingredient) => !ingredient.inFridge)
    .map((ingredient) => ingredient.name);

    setShoppingList((prev) => [
      ...new Set([...prev, ...missing]),
    ]);
  };

  const getPrepTime = (prepTime) => {
    const match = prepTime?.match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  const filteredRecipes = recipes.filter(recipe => {
    const missingCount = recipe.totalIngredients - recipe.matchCount;

    if(savedFilterActive && !recipe.saved) return false;
    if(activeFilters.cookNowOnly && missingCount > 0) return false;
    if(activeFilters.missingOnly && missingCount === 0) return false;
    if(activeFilters.useSoonOnly && !recipe.usesExpiringItem) return false;
    if(activeFilters.maxTime !== 'all' && getPrepTime(recipe.prepTime) > Number(activeFilters.maxTime)) return false;
    return true;
  });

  const clearFilters = () => {
    setActiveFilters({
      cookNowOnly: false,
      useSoonOnly: false,
      missingOnly: false,
      maxTime: 'all',
    });
    setSavedFilterActive(false);
  }

  const hasActiveFilters = 
  savedFilterActive || 
  activeFilters.cookNowOnly ||
  activeFilters.useSoonOnly || 
  activeFilters.missingOnly ||
  activeFilters.maxTime !== 'all';

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
          aria-label="Open recipe filters"
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
          <h4>What are we cooking today?</h4>
          <p>Let us turn your fridge into something delicious.</p>
          </div>
        </div>
        <button
        onClick={handleGenerateAiRecipes}
        disabled={isLoading}
        className="recipe-button-2 recipe-button-2-primary"
        >
          {isLoading ? 'Generating...' : 'Generate Recipes'}
        </button>
      </div>

      {error && (
        <div style={{padding: '12px 16px', background: '#fff3e0', border: '1px solid #e65100', borderRadius: '8px', color: '#9a3412', fontSize: '0.85rem', marginBottom: '20px'}}
        role="alert"
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
        >
          <div>
            <h2
              style={{
                color: '#15291b',
                fontSize: '1.4rem',
                margin: '0 0 5px'
              }}
              >
                Your Recipes
            </h2>
            <p
            style={{
              color: '#6b7280',
              fontSize: '0.85rem',
              margin: 0,
            }}
            >
              Creating Meals around the items in your fridge.
            </p>
          </div>

          <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}
          >
            <button
            className={`recipe-button-2 ${
              !savedFilterActive ? 'recipe-button-2-primary' : 'recipe-button-2-light'
            }`}
            onClick={() => setSavedFilterActive(false)}
            >
              All Recipes
            </button>

            <button
            className={`recipe-button-2 ${
              savedFilterActive ? 'recipe-button-2-primary' : 'recipe-button-2-light'
            }`}
            onClick={() => setSavedFilterActive(true)}
            >
              ❤️Saved
            </button>
          </div>
      </div>

      {hasActiveFilters && (
        <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}
        >
          <span
          style={{
            fontSize: '0.8rem',
            color: '#6b7280',
          }}
          >
            Filters applied
          </span>

          <button
          onClick={clearFilters}
          style={{
            background: 'none',
            border: 'none',
            color: '#2d6a4f',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
          >
            Clear all
          </button>
        </div>
      )}

      {isLoading && (
        <div className="recipes-grid">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      )}

      {!isLoading && recipes.length > 0 && filteredRecipes.length === 0 &&(
        <div className="empty-state">
            <span style={{fontSize: '2rem', display: 'block', marginBottom: '8px'}}></span>
            <h3 >No recipes generated yet</h3>
            <p>Try changing your filters to see more recipes.</p>

            <button
            onClick={clearFilters}
            className="recipe-button-2 recipe-button-2-primary"
            style={{marginTop: '16px'}}
            > Clear Filters</button>
        </div>
      )}

      {!isLoading && filteredRecipes.length > 0 && (
        <div className="recipes-grid">
          {filteredRecipes.map((recipe) => {
            const missingCount = recipe.totalIngredients - recipe.matchCount;
            return (
              <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => setSelectedRecipe(recipe)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' '){
                  event.preventDefault();
                  setSelectedRecipe(recipe);
                }
              }}
              >
                <div>
                  <div className="card-header">
                  <h3 className="card-title">{recipe.title}</h3>

                  <button
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSaved(recipe.id);
                  }}
                  aria-label={
                    recipe.saved ? 'Remove from saved recipes' : 'Save Recipe'
                  }

                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: recipe.saved ? '#e65100' : '#9ca3af',
                    cursoe: 'pointer',
                    fintSize: '1.5rem',
                    flexShrink: 0,
                  }}
                  >
                    {recipe.saved ? '❤️' : '🤍'}
                  </button>
                  </div>

                  <div className="card-meta">
                    <span>⏰ {recipe.prepTime}</span>
                  </div>

                  <p className="ingredient-summary">
                    {recipe.description}
                  </p>
                </div>

                <div className="card-footer">
                  <span className={`badge ${missingCount === 0 ? 'badge-green' : 'badge-orange'}`}>
                    {missingCount === 0 ? 'All in fridge' : `Missing ${missingCount}`}
                  </span>
                  <span style={{fontSize: '0.8rem', fontWeight: 500, color: '#2d6a4f' }}>
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
            <div className="recipe-modal-content" onClick={(event) => event.stopPropagation()}>
              <div className="recipe-modal-header">
                <h3 style={{margin: 0, fontSize: '1.1rem', color: '#15291b'}}>Filter Recipes</h3>
                <button className="recipe-modal-close" onClick={() => setIsFilterModalOpen(false)}>&times;</button>
              </div>

              <div className="filter-group">
                <label>
                  <input
                  type="checkbox"
                  checked={activeFilters.cookNowOnly}
                  onChange={(event) => setActiveFilters((prev) => ({
                    ...prev,
                    cookNowOnly: event.target.checked,
                    missingOnly: event.target.checked ? false : prev.missingOnly,
                  }))
                  }
                  
                  />
                  <span>Cook Now (100% Fridge Match)</span>
                </label>
                <label>
                  <input
                  type="checkbox"
                  checked={activeFilters.missingOnly}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setActiveFilters((prev) => ({
                      ...prev,
                      missingOnly: checked,
                      cookNowOnly: checked ? false : prev.cookNowOnly,
                    }));
                  }} 
                  />
                  <span>Recipes with Missing Ingredients</span>
                  </label>

                  <label>
                  <input
                  type="checkbox"
                  checked={activeFilters.useSoonOnly}
                  onChange={(event) => setActiveFilters({...prev, useSoonOnly: event.target.checked})}
                  />
                  <span>Uses Expiring Ingredients</span>
                </label>
              </div>

              <div className="filter-group">
                <h4
                style={{
                  fintSize: '0.9rem',
                  color: '#15291b',
                  marginBottom: '10px',
                }}
                > Maximum Prep Time</h4>

                <select
                value={activeFilters.maxTime}
                onChange={(event) => 
                  setActiveFilters((prev) => ({
                    ...prev,
                    maxTime: event.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#fff',
                }}
                >

                  <option value="all">Any amount of time</option>
                  <option value="15">15 minutes or less</option>
                  <option value="30">30 minutes or less</option>
                  <option value="45">45 minutes or less</option>
                  <option value="60">60 minutes or less</option>
                </select>
              </div>
                <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '24px',
                }}
                >
                  <button
                  className="recipe-button-2 recipe-button-2-light"
                  onClick={clearFilters}
                  style={{ flex: 1}}
                  >Reset</button>

                  <button
                  className="recipe-button-2 recipe-button-2-primary"
                  onClick={() => setIsFilterModalOpen(false)}
                  style={{ flex: 1}}
                  >Show Recipes</button>
                </div>
            </div>
          </div>
      )}

      {selectedRecipe && (
        <div className="recipe-modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="recipe-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="recipe-modal-header" style={{alignItems: 'flex-start'}}>
              <div>
                <span style={{fontSize: '0.8rem', color: '#6b7280'}}>{selectedRecipe.prepTime}</span>
                <h2 style={{fontSize: '1.25rem', fontWeight: 700, margin: '4px 0 0 0', color: '#15291b'}}>{selectedRecipe.title}</h2>
              </div>

              <button className="recipe-modal-close" onClick={() => setSelectedRecipe(null)} aria-label="Close recipe">&times;</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '20px' }}>{selectedRecipe.description}</p>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: '#1b4332' }}>Ingredients</h4>
                {selectedRecipe.ingredients?.some(
                  (ingredient) => !ingredient.inFridge) && (
                  <button
                  onClick={() => addMissingToShoppingList(selectedRecipe.ingredients)}
                  style={{background: 'none', border: 'none', color: '#2d6a4f', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'}}
                  >
                    + Add missing to shopping list
                  </button>
                )}
            </div>

            <ul style={{ listStyle: 'none', padding: '12px', margin: 0, background: '#f7f8f4', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              {selectedRecipe.ingredients?.map((ingredient, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span 
                    style={{
                      color: ingredient.inFridge ? '#1f2937' : '#c2410c', fontWeight: ingredient.inFridge ? 400 : 500,
                    }}
                    >{ingredient.inFridge ? '✓ ' : 'x '}{ingredient.name}</span>
                    
                  <span style = {{fontSize: '0.75rem', color: ingredient.inFridge ? '#1b4332' : '#e65100', fontWeight: 600, whiteSpace: 'nowrap'}}>
                    {ingredient.inFridge ? 'In Fridge' : "Need to buy"}
                  </span>
                </li>
              ))}
            </ul>
            </div>
              
              <div style={{marginBottom: '24px'}}>
              <h4 style={{fontSize: '0.9rem', fontWeight: 600, margin: '0 0 8px 0', color: '#1b4332'}}>Instructions</h4>
              <ol style={{paddingLeft: '20px', fontSize: '0.85rem', color: '#374161', lineHeight: 1.6, margin: 0}}>
                {selectedRecipe.instructions?.map((step,index) => (
                  <li key={index} style={{marginBottom: '6px'}}>{step}</li>
                ))}
              </ol>
              </div>

              <div
              style={{display: 'flex',
                gap: '10px',
                flexDirection: 'column',
              }}
              >
                <button
                onClick={() => toggleSaved(selectedRecipe.id)}
                className="recipe-button-2 recipe-button-2-light"
                style={{ width: '100%'}}
                >

                  {selectedRecipe.saved
                  ? '❤️ Remove from Saved' : '🤍 Save Recipe'
                  }
                </button>

              

              <button
              onClick={() => {
                alert('Recipe has been cooked, Ingredients have been removed from the fridge.');
                setSelectedRecipe(null);
              }}
              className="recipe-button-2 recipe-button-2-primary"
              style={{width: '100%'}}
              > Mark as Cooked</button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
