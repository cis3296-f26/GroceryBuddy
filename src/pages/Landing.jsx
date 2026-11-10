import { useRef } from 'react'
import { signInWithGoogle } from '../supabase'
import '../App.css'
import './Landing.css'

const WORD_ROWS = [
  [
    { letter: 'E', tone: 'red', rotate: -3 },
    { letter: 'A', tone: 'orange', rotate: 3 },
    { letter: 'T', tone: 'lime', rotate: -2 },
    { gap: true },
    { letter: 'M', tone: 'blue', rotate: -4 },
    { letter: 'E', tone: 'dark', rotate: 3 },
  ],
  [
    { letter: 'F', tone: 'lime', rotate: 2 },
    { letter: 'I', tone: 'blue', rotate: -4 },
    { letter: 'R', tone: 'dark', rotate: 2 },
    { letter: 'S', tone: 'red', rotate: -2 },
    { letter: 'T', tone: 'orange', rotate: 4 },
    { letter: '.', tone: 'lime', rotate: -3, dot: true },
  ],
]

const ICONS = {
  carrot: (
    <>
      <path d="M17 7 5 20.5c-.6.6-1.6 0-1.3-.8L10.5 6.5a4 4 0 0 1 6.5.5Z" />
      <path d="M15.5 6.5 17 2l1.2 4 3.8-.7-3 3.2" />
    </>
  ),
  milk: (
    <path d="M8 2h8v3l2.5 4v12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V9L8 5V2Zm-1.5 9v7h11v-7h-11Z" fillRule="evenodd" />
  ),
  egg: <path d="M12 2c4 0 7.5 7 7.5 12a7.5 7.5 0 0 1-15 0C4.5 9 8 2 12 2Z" />,
  apple: (
    <>
      <path d="M12 7.5c2-1.5 6-1.5 7.5 1.5 1.8 3.6-.5 10.5-3.5 12-1.5.8-2.5 0-4 0s-2.5.8-4 0c-3-1.5-5.3-8.4-3.5-12C6 6 10 6 12 7.5Z" />
      <path d="M12 7c0-2 1-4 3.5-5 0 2.5-1.5 4.5-3.5 5Z" />
    </>
  ),
  cheese: (
    <path d="M2 11 15 4l7 7v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8Zm5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8-1a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" fillRule="evenodd" />
  ),
  drumstick: (
    <>
      <path d="M14.5 2.5a7 7 0 0 1 5 12c-2 2-5 2.5-7 1.5L9 19.5l-3-3L9.5 13c-1-2-.5-5 1.5-7a7 7 0 0 1 3.5-3.5Z" />
      <circle cx="4.5" cy="19.5" r="2.5" />
      <circle cx="6.5" cy="21.5" r="2" />
    </>
  ),
}

const MAGNETS = {
  left: [
    { icon: 'carrot', bg: '#E3A33B', ink: '#14241C', rotate: -8, top: 18 },
    { icon: 'milk', bg: '#4D8FD6', ink: '#fff', rotate: 6, top: 46 },
    { icon: 'egg', bg: '#A3C94A', ink: '#14241C', rotate: -5, top: 73 },
  ],
  right: [
    { icon: 'apple', bg: '#D8573C', ink: '#fff', rotate: 7, top: 22 },
    { icon: 'cheese', bg: '#E3A33B', ink: '#14241C', rotate: -6, top: 50 },
    { icon: 'drumstick', bg: '#1E4D3A', ink: '#fff', rotate: 5, top: 77 },
  ],
}

function MagnetColumn({ side }) {
  return (
    <div className={`magnet-margin magnet-${side}`} aria-hidden="true">
      {MAGNETS[side].map((magnet) => (
        <span
          key={magnet.icon}
          className="food-magnet"
          style={{
            top: `${magnet.top}%`,
            background: magnet.bg,
            color: magnet.ink,
            transform: `translate(-50%, -50%) rotate(${magnet.rotate}deg)`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
            {ICONS[magnet.icon]}
          </svg>
        </span>
      ))}
    </div>
  )
}

const STATUSES = [
  { label: 'Use Today', tone: 'today' },
  { label: 'Use Soon', tone: 'soon' },
  { label: 'Good for Now', tone: 'good' },
  { label: 'Past Estimate', tone: 'past' },
]

const FEATURES = [
  {
    title: 'Add in seconds',
    description: 'Pick the food, where it lives and when you bought it.',
  },
  {
    title: 'Know what is next',
    description: 'Use Today, Use Soon, Good for Now, Past Estimate.',
  },
  {
    title: 'Shop smarter',
    description: 'A shopping list for what you have run out of.',
  },
]

const NO_TILT = '(hover: none), (prefers-reduced-motion: reduce)'
const EASE_BACK = '300ms cubic-bezier(.34,1.56,.64,1)'
const FOLLOW = '120ms linear'

function TiltTile({ tile }) {
  const tileRef = useRef(null)
  const shadowRef = useRef(null)
  const frame = useRef(0)
  const rest = `rotate(${tile.rotate}deg)`

  function apply(transition, tileTransform, shadowTransform) {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      tileRef.current.style.transition = `transform ${transition}`
      shadowRef.current.style.transition = `transform ${transition}`
      tileRef.current.style.transform = tileTransform
      shadowRef.current.style.transform = shadowTransform
    })
  }

  function handleMove(event) {
    if (window.matchMedia(NO_TILT).matches) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    const y = (event.clientY - box.top) / box.height - 0.5
    apply(
      FOLLOW,
      `${rest} translateZ(30px) rotateY(${x * 36}deg) rotateX(${-y * 36}deg)`,
      `${rest} translate(${-x * 20}px, ${-y * 20}px)`,
    )
  }

  function handleLeave() {
    if (window.matchMedia(NO_TILT).matches) return
    apply(EASE_BACK, rest, rest)
  }

  return (
    <span className="word-cell" onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <span className="word-shadow" ref={shadowRef} style={{ transform: rest }} />
      <span
        ref={tileRef}
        className={`word-tile tone-${tile.tone}${tile.dot ? ' word-dot' : ''}`}
        style={{ transform: rest }}
      >
        {tile.letter}
      </span>
    </span>
  )
}

function Landing() {
  const returning = localStorage.getItem('gb_returning') === '1'
  const signIn = () => signInWithGoogle()

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="GroceryBuddy home">
          <img src="/logo.svg" alt="" />
          <span className="brand-word">
            grocerybuddy<span className="brand-period">.</span>
          </span>
        </a>
        <nav className="landing-nav" aria-label="Primary">
          <button
            type="button"
            className={`${returning ? 'pill-outline' : 'pill-dark'} nav-pill`}
            onClick={signIn}
          >
            Sign up
          </button>
          <button
            type="button"
            className={`${returning ? 'pill-dark' : 'pill-outline'} nav-pill`}
            onClick={signIn}
          >
            Sign in
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <MagnetColumn side="left" />
        <MagnetColumn side="right" />
        <section className="landing-hero">
          <div className="word-blocks" aria-label="Eat me first.">
            {WORD_ROWS.map((row, rowIndex) => (
              <div className="word-row" key={rowIndex} aria-hidden="true">
                {row.map((tile, index) =>
                  tile.gap ? (
                    <span className="word-gap" key={index} />
                  ) : (
                    <TiltTile key={index} tile={tile} />
                  ),
                )}
              </div>
            ))}
          </div>
          <p className="hero-copy">
            Grocery Buddy keeps track of what is in your fridge
            <br />
            and tells you what is about to expire.
          </p>
          <div className="status-row">
            <span className="status-label">Every item gets a status:</span>
            {STATUSES.map((status) => (
              <span className={`status-pill status-${status.tone}`} key={status.tone}>
                {status.label}
              </span>
            ))}
          </div>
          <div className="feature-cards" id="features">
            {FEATURES.map((feature) => (
              <div className="feature-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fridge" aria-hidden="true" id="how-it-works">
          <div className="fridge-body">
            <span className="fridge-handle handle-top" />
            <span className="fridge-handle handle-bottom" />
            <span className="fridge-split" />
            <div className="fridge-display">
              <span className="display-label">TODAY</span>
              <p>
                3 things need
                <br />
                you first
              </p>
              <div className="display-dots">
                <span className="dot-red" />
                <span className="dot-orange" />
                <span className="dot-lime" />
              </div>
            </div>
            <div className="sticky sticky-list">
              <span className="pin dot-red" />
              <strong>Eat these first:</strong>
              <ol>
                <li>Milk</li>
                <li>Spinach</li>
                <li>Eggs</li>
              </ol>
            </div>
            <span className="fridge-magnet">
              <img src="/logo.svg" alt="" />
            </span>
            <div className="sticky sticky-note">
              <span className="pin dot-lime" />
              <ul>
                <li>Chicken and vegetables</li>
                <li>Pasta with tomato sauce</li>
                <li>Vegetable fried rice</li>
                <li>Spinach and cheese omelet</li>
              </ul>
            </div>
          </div>
          <span className="fridge-foot foot-left" />
          <span className="fridge-foot foot-right" />
        </section>
      </main>
    </div>
  )
}

export default Landing
