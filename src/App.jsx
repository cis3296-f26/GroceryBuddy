import { useRef, useState } from 'react'
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
    description: 'Pick the thing you’d most like a hand with.',
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
    min: 1,
    max: 300,
    placeholder: 'Your height',
    units: ['cm', 'in'],
    optional: true,
  },
  {
    id: 'weight',
    section: 'A little more about you',
    title: 'What’s your current weight?',
    description: 'One last optional detail for your profile.',
    type: 'number',
    min: 1,
    max: 1500,
    placeholder: 'Your weight',
    units: ['kg', 'lb'],
    optional: true,
  },
]

function App() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [units, setUnits] = useState({ height: 'cm', weight: 'kg' })
  const [details, setDetails] = useState({})
  const [error, setError] = useState('')
  const [finished, setFinished] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
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
    if (
      (!q.optional &&
        !(Array.isArray(value) ? value.length : value.trim().length)) ||
      (q.type === 'number' &&
        value !== '' &&
        (!Number.isFinite(Number(value)) ||
          Number(value) < q.min ||
          Number(value) > q.max))
    ) {
      setError(
        q.type === 'number'
          ? `Enter a number between ${q.min} and ${q.max}, or skip this question.`
          : 'Please add an answer to keep going.',
      )
      return
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
          <div className="progress-meta">
            <span>{progress}% complete</span>
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
                    <select
                      aria-label={`${q.id} units`}
                      value={units[q.id]}
                      onChange={(event) =>
                        setUnits({ ...units, [q.id]: event.target.value })
                      }
                    >
                      {q.units.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
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
          <footer>
            <span>
              {finished
                ? 'Made for your everyday.'
                : `${String(step + 1).padStart(2, '0')} / ${questions.length}`}
            </span>
            <div>
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
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}

function Dashboard ({answers}){

  const [fridgeItems, setFridgeItems] = useState([]);
  const firstLetter = answers?.name ? answers.name.charAt(0).toUpperCase() : '';
  const [isModalOpen, setIsModalOpen] = useState(false);

  

  const handleAdditions = () => {
    const newItem = prompt("Enter Your Fridge Items Here!");
    if(newItem && newItem.trim() !== ""){
      setFridgeItems([...fridgeItems,newItem]);
    }
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
              <AddFoodModal onClose={() => setIsModalOpen(false)}/>
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
            onClick={() => alert("ShoppingList Button Clicked")}
            >
              <span className="shoppinglist-button-title">Generate a Shopping List</span>
              <span className="shoppinglist-button-description">We'll create a list for all of the foods you love!</span>
            </button>
            
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

function AddFoodModal({onClose}){
  return(
    <div className="add-food-backdrop" onClick={onClose}>
      <div className="add-food-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-food-header">
          <h2>Add Food Here</h2>
          <button className="add-food-close-button" onClick={onClose}>&times;</button>
        </div>
        <p>Enter the items here</p>
      </div>
    </div>
  );
}


/**/
export default App
