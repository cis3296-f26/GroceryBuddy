import { useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import { useSession } from './supabase'
import './App.css'
import { api } from './api'

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

function RecipesPage({items, onBackToDashboard, answers}){
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
  const[, setShoppingList] = useState([]);

  

  const handleGenerateAiRecipes = async() => {
    setIsLoading(true);
    setError(null);

    try{
      if(!items?.length){
        setError('Add some ingredients to your fridge before generating recipes.');
      }
      } catch {
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
    if(activeFilters.missingOnly && recipe.matchCount === recipe.totalIngredients) return false;
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
          >Filters</button>
        </div>
        <div className="profile-dropdown-container">
       
        <button className="profile-button">
          <span className="profile-initial">{firstLetter}.</span>
          <span className="profile-fullname">{answers?.name}</span>
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
          {isLoading ? 'Generating...' : 'Explore Recipes'}
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
              Creating meals around the items in your fridge.
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
              ❤️ Saved
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
                  onChange={(event) => setActiveFilters(previous => ({...previous, useSoonOnly: event.target.checked}))}
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
                alert('To record ingredients used, update their quantities in your grocery inventory.');
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
