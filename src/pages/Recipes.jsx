import { useEffect, useState } from 'react'
import { api } from '../api'
import { freshness } from '../data/dashboardItems'
import RecipeChat from './RecipeChat'
import Sidebar from './Sidebar'
import './Recipes.css'

const URGENT = { useToday: 'Use Today', useSoon: 'Use Soon' }

function Recipes() {
  const [expiring, setExpiring] = useState([])
  const [recipes, setRecipes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Show what is about to expire so people know what the recipes are built around.
  useEffect(() => {
    const controller = new AbortController()
    api('inventory/items/', { signal: controller.signal })
      .then(items => {
        if (!Array.isArray(items) || controller.signal.aborted) return
        setExpiring(
          items
            .filter(item => item.quantity > 0 && URGENT[freshness(item)])
            .sort((a, b) => a.expiration_date.localeCompare(b.expiration_date)),
        )
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  async function generate() {
    setLoading(true)
    setError('')
    try {
      // The backend builds the ingredient list from your inventory, so send nothing.
      const data = await api('recipes/generate/', { method: 'POST', body: {} })
      setRecipes(data.recipes)
    } catch (err) {
      setError(err.status === 429
        ? 'Slow down a little: you can generate recipes about 5 times a minute. Try again in a moment.'
        : err.message || 'Could not generate recipes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dash-shell">
      <Sidebar />
      <main className="recipes-page">
        <header className="recipes-heading">
          <div>
            <h1>Recipe ideas</h1>
            <p>Quick meals built from what is in your fridge, starting with what expires first.</p>
          </div>
          <button type="button" className="recipes-generate" onClick={generate} disabled={loading}>
            {loading ? 'Cooking up ideas…' : recipes ? 'Get new ideas' : 'Suggest recipes'}
          </button>
        </header>

        {expiring.length > 0 && (
          <section className="recipes-expiring" aria-label="Expiring soon">
            <strong>Use up first</strong>
            <ul>
              {expiring.map(item => (
                <li key={item.id} className={`chip-${freshness(item)}`}>
                  {item.name}
                  <span>{URGENT[freshness(item)]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <RecipeChat />

        {error && <p role="alert" className="recipes-error">{error}</p>}
        {loading && <p role="status" className="recipes-status">Looking through your groceries…</p>}

        {!recipes && !loading && !error && (
          <div className="recipes-empty">
            <span aria-hidden="true">🍳</span>
            <h2>Hungry? Cook what expires first.</h2>
            <p>Tap “Suggest recipes” and we will make three quick ideas from your current groceries.</p>
          </div>
        )}

        {recipes && (
          <div className="recipes-grid">
            {recipes.map(recipe => (
              <article className="recipe-card" key={recipe.name}>
                <div className="recipe-top">
                  <h2>{recipe.name}</h2>
                  <span className="recipe-time">{recipe.time_minutes} min</span>
                </div>
                <p className="recipe-uses">
                  Uses {recipe.uses.join(', ')}
                </p>
                <h3>Ingredients</h3>
                <ul>
                  {recipe.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}
                </ul>
                <h3>Steps</h3>
                <ol>
                  {recipe.steps.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Recipes
