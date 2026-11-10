// Placeholder data source for the dashboard — swap for a real fridge-items API later.
export const CATEGORIES = [
  { key: 'useToday', label: 'Use Today', tone: 'today' },
  { key: 'useSoon', label: 'Use Soon', tone: 'soon' },
  { key: 'goodForNow', label: 'Good for Now', tone: 'good' },
  { key: 'pastEstimate', label: 'Past Estimate', tone: 'past' },
]

export function getSampleFridgeItems() {
  return [
    { id: 'milk', name: 'Milk', icon: '🥛', location: 'Fridge', detail: 'Opened 5 days ago', category: 'useToday' },
    { id: 'spinach', name: 'Spinach', icon: '🥬', location: 'Fridge', detail: 'Bought 4 days ago', category: 'useToday' },
    { id: 'yogurt', name: 'Yogurt', icon: '🥣', location: 'Fridge', detail: 'Bought 5 days ago', category: 'useSoon' },
    { id: 'cheese', name: 'Cheese', icon: '🧀', location: 'Fridge', detail: 'Opened 6 days ago', category: 'useSoon' },
    { id: 'eggs', name: 'Eggs', icon: '🥚', location: 'Fridge', detail: 'Bought 8 days ago', category: 'useSoon' },
    { id: 'bread', name: 'Bread', icon: '🍞', location: 'Pantry', detail: 'Bought 2 days ago', category: 'goodForNow' },
    { id: 'apples', name: 'Apples', icon: '🍎', location: 'Fridge', detail: 'Bought 3 days ago', category: 'goodForNow' },
    { id: 'rice', name: 'Leftover rice', icon: '🍱', location: 'Fridge', detail: 'Cooked yesterday', category: 'goodForNow' },
    { id: 'oatmilk', name: 'Oat milk', icon: '🥛', location: 'Fridge', detail: 'Opened 12 days ago', category: 'pastEstimate' },
  ]
}
