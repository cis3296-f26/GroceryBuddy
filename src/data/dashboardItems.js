export const CATEGORIES = [
  { key: 'useToday', label: 'Use Today', tone: 'today' },
  { key: 'useSoon', label: 'Use Soon', tone: 'soon' },
  { key: 'goodForNow', label: 'Good for Now', tone: 'good' },
  { key: 'pastEstimate', label: 'Past Estimate', tone: 'past' },
]

export const FOOD_CATEGORIES = ['Fruit', 'Vegetable', 'Grain', 'Protein', 'Dairy', 'Eggs', 'Seafood', 'Beverage', 'Meat', 'Bread', 'Pantry']
export const STORAGE_LOCATIONS = ['fridge', 'freezer', 'pantry']

export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function freshness(item, today = localDate()) {
  if (!item.expiration_date) return 'goodForNow'
  // Calendar-day arithmetic avoids timezone offsets and daylight-saving transitions.
  const days = (Date.parse(item.expiration_date) - Date.parse(today)) / 86400000
  if (days < 0) return 'pastEstimate'
  if (days === 0) return 'useToday'
  if (days <= 3) return 'useSoon'
  return 'goodForNow'
}
