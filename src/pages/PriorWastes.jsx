import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import './PriorWastes.css'

/*
 * Flow: answer "how am I doing?" first, then "why?", then "what do I do?".
 *   1. Headline: pounds wasted, share of food, cost, and the trend.
 *   2. Why: where the waste comes from, and what gets bought.
 *   3. Act: shortcuts to cook what expires first and to plan a smarter list.
 *
 * The numbers below are sample data; used/tossed history is not recorded yet.
 */

const PERIODS = [
  { key: 'week', label: 'Week', phrase: 'this week' },
  { key: 'month', label: 'Month', phrase: 'this month' },
  { key: 'quarter', label: '3 months', phrase: 'in the last 3 months' },
  { key: 'year', label: 'Year', phrase: 'this year' },
]

const DATA = {
  week: {
    wasted: 1.1, eaten: 9.4, purchased: 14, cost: 4.6, change: -8,
    waste: [['Produce', 52], ['Dairy', 28], ['Pantry', 12], ['Other', 8]],
    bought: [['Produce', 42], ['Dairy', 28], ['Pantry', 20], ['Frozen', 10]],
    frequent: [['Bananas', 3], ['Milk', 2], ['Strawberries', 2], ['Bread', 1], ['Eggs', 1]],
  },
  month: {
    wasted: 4.2, eaten: 38, purchased: 52, cost: 18.5, change: -12,
    waste: [['Produce', 55], ['Dairy', 25], ['Pantry', 12], ['Other', 8]],
    bought: [['Produce', 40], ['Dairy', 30], ['Pantry', 20], ['Frozen', 10]],
    frequent: [['Bananas', 12], ['Milk', 9], ['Strawberries', 7], ['Bread', 6], ['Eggs', 5]],
  },
  quarter: {
    wasted: 13.8, eaten: 112, purchased: 160, cost: 61.2, change: -5,
    waste: [['Produce', 58], ['Dairy', 22], ['Pantry', 12], ['Other', 8]],
    bought: [['Produce', 41], ['Dairy', 29], ['Pantry', 21], ['Frozen', 9]],
    frequent: [['Bananas', 34], ['Milk', 27], ['Strawberries', 19], ['Bread', 18], ['Eggs', 15]],
  },
  year: {
    wasted: 52, eaten: 430, purchased: 640, cost: 232, change: 3,
    waste: [['Produce', 57], ['Dairy', 23], ['Pantry', 13], ['Other', 7]],
    bought: [['Produce', 40], ['Dairy', 30], ['Pantry', 21], ['Frozen', 9]],
    frequent: [['Bananas', 131], ['Milk', 104], ['Strawberries', 77], ['Bread', 70], ['Eggs', 61]],
  },
}

const COLORS = ['#4f936b', '#a8c98c', '#e6c77a', '#d9a16a']

function Bars({ rows, unit = '%' }) {
  const max = Math.max(...rows.map(([, value]) => value))
  return (
    <ul className="pw-bars">
      {rows.map(([name, value], index) => (
        <li key={name}>
          <span className="pw-bar-name">{name}</span>
          <span className="pw-bar-track">
            <span style={{ width: `${(value / max) * 100}%`, background: COLORS[index % COLORS.length] }} />
          </span>
          <strong>{value}{unit}</strong>
        </li>
      ))}
    </ul>
  )
}

export default function PriorWastes() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const info = PERIODS.find(item => item.key === period)
  const data = DATA[period]

  const total = data.wasted + data.eaten
  const wastedShare = Math.round((data.wasted / total) * 100)
  const better = data.change <= 0
  const topWaste = data.waste[0][0]

  return (
    <div className="dash-shell">
      <Sidebar />

      <main className="insights-page">
        <header className="pw-heading">
          <div>
            <h1>Prior wastes</h1>
            <p>Understand your habits, waste less, save more.</p>
          </div>
          <div className="pw-periods" role="group" aria-label="Time period">
            {PERIODS.map(item => (
              <button
                type="button"
                key={item.key}
                className={item.key === period ? 'is-active' : ''}
                aria-pressed={item.key === period}
                onClick={() => setPeriod(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <p className="pw-sample">
          <span>Sample data</span> Waste tracking is coming soon, so these numbers are examples.
        </p>

        <section className="pw-hero" aria-label="Summary">
          <div className="pw-hero-text">
            <span className="pw-kicker">Food wasted {info.phrase}</span>
            <div className="pw-big">
              {data.wasted} <small>lbs</small>
            </div>
            <p>
              That is {wastedShare}% of the food you tracked, worth about ${data.cost.toFixed(2)}.
            </p>
            <span className={`pw-trend ${better ? 'pw-trend--good' : 'pw-trend--bad'}`}>
              {better ? '↓' : '↑'} {Math.abs(data.change)}% {better ? 'less' : 'more'} than the period before
            </span>
          </div>

          <div className="pw-hero-split">
            <div
              className="pw-split-bar"
              role="img"
              aria-label={`${100 - wastedShare}% eaten, ${wastedShare}% wasted`}
            >
              <span className="pw-split-eaten" style={{ width: `${100 - wastedShare}%` }} />
              <span className="pw-split-wasted" style={{ width: `${wastedShare}%` }} />
            </div>
            <div className="pw-split-legend">
              <span><i className="pw-dot pw-dot--eaten" /> Eaten <strong>{data.eaten} lbs</strong></span>
              <span><i className="pw-dot pw-dot--wasted" /> Wasted <strong>{data.wasted} lbs</strong></span>
            </div>
          </div>
        </section>

        <section className="pw-kpis" aria-label="Key numbers">
          <article>
            <span>Items purchased</span>
            <strong>{data.purchased}</strong>
          </article>
          <article>
            <span>Money wasted</span>
            <strong>${data.cost.toFixed(2)}</strong>
          </article>
          <article>
            <span>Biggest source of waste</span>
            <strong>{topWaste}</strong>
          </article>
        </section>

        <div className="pw-columns">
          <section className="pw-card">
            <h2>Where waste comes from</h2>
            <p>Share of wasted food by category</p>
            <Bars rows={data.waste} />
          </section>

          <section className="pw-card">
            <h2>What you buy</h2>
            <p>Share of purchases by category</p>
            <Bars rows={data.bought} />
          </section>
        </div>

        <section className="pw-card">
          <h2>Most frequently bought</h2>
          <p>Your regulars, a good place to buy just a bit less</p>
          <Bars rows={data.frequent} unit="×" />
        </section>

        <section className="pw-act" aria-label="Ways to waste less">
          <div>
            <h2>Waste less next week</h2>
            <p>
              {topWaste} is where most of your waste comes from. Cook it first and
              buy a little less of it next trip.
            </p>
          </div>
          <div className="pw-act-buttons">
            <button type="button" onClick={() => navigate('/recipes')}>Cook what expires first</button>
            <button type="button" className="is-ghost" onClick={() => navigate('/shoppinglist')}>Plan a smarter list</button>
          </div>
        </section>
      </main>
    </div>
  )
}
