import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

/*
 * Backend contract (to be implemented):
 *
 *   POST /api/recipes/chat/        (Authorization: Bearer <supabase token>)
 *   Request:  { "message": string (1-500 chars),
 *               "history": [{ "role": "user" | "assistant", "content": string }] }  // last 10 turns
 *   Response: { "reply": string }   // plain text, may contain line breaks
 *
 * Errors use the usual { "detail": "..." } body: 429 when throttled,
 * 502/503 when the AI is unavailable. The server should read the user's
 * groceries from the database itself rather than trust the client.
 */
const ENDPOINT = 'recipes/chat/'
const MAX_LENGTH = 500
const HISTORY_TURNS = 10

const STARTERS = [
  'What can I cook with what expires first?',
  'Give me a 10-minute dinner idea',
  'How do I use up leftover rice?',
  'Can I freeze spinach before it goes bad?',
]

function friendlyError(err) {
  if (err.status === 404 || err.status === 405 || err.status === 501) {
    return 'Recipe chat is not connected yet. Please check back soon.'
  }
  if (err.status === 429) {
    return 'Slow down a little: try again in a moment.'
  }
  return err.message || 'Something went wrong. Please try again.'
}

function RecipeChat() {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const logRef = useRef(null)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, loading])

  async function send(text) {
    const message = text.trim().slice(0, MAX_LENGTH)
    if (!message || loading) return
    const history = messages.slice(-HISTORY_TURNS)
    setMessages(current => [...current, { role: 'user', content: message }])
    setDraft('')
    setError('')
    setLoading(true)
    try {
      const data = await api(ENDPOINT, { method: 'POST', body: { message, history } })
      if (typeof data?.reply !== 'string' || !data.reply.trim()) {
        throw new Error('The assistant sent back an empty answer. Please try again.')
      }
      setMessages(current => [...current, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    send(draft)
  }

  function handleKeyDown(event) {
    // Enter sends; Shift+Enter adds a new line.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(draft)
    }
  }

  return (
    <section className="chat-card" aria-label="Recipe assistant">
      <div className="chat-head">
        <div>
          <h2>Ask the recipe assistant</h2>
          <p>Ask about recipes, substitutions, storage, or what to cook next.</p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="chat-clear" onClick={() => { setMessages([]); setError('') }}>
            Clear chat
          </button>
        )}
      </div>

      <div className="chat-log" ref={logRef} role="log" aria-live="polite">
        {messages.length === 0 && !loading && (
          <div className="chat-starters">
            {STARTERS.map(starter => (
              <button type="button" key={starter} onClick={() => send(starter)}>{starter}</button>
            ))}
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble chat-${message.role}`}>{message.content}</div>
        ))}
        {loading && (
          <div className="chat-bubble chat-assistant chat-typing" role="status" aria-label="Assistant is typing">
            <span /><span /><span />
          </div>
        )}
      </div>

      {error && <p role="alert" className="chat-error">{error}</p>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about recipes…"
          aria-label="Your question"
          rows={1}
          maxLength={MAX_LENGTH}
        />
        <button type="submit" disabled={loading || !draft.trim()}>Send</button>
      </form>
    </section>
  )
}

export default RecipeChat
