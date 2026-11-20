from grocery_buddy.ai import generate_json

FOOD_TYPES = [
    "Fruit",
    "Vegetable",
    "Grain",
    "Protein",
    "Dairy",
    "Eggs",
    "Seafood",
    "Beverage",
    "Meat",
    "Bread",
    "Pantry"
]

def match_with_ai(food):
    prompt = "\n".join([
        "You are an AI assistant that helps users identify food types.",
        "Pick the one food type that best matches the given food item from the list below.",
        f"Food item: {food}",
        f"Food types: {', '.join(FOOD_TYPES)}",
        'Return only JSON, like {"category": "Vegetable"}. If none match, use {"category": null}.',
    ])
    result = generate_json(prompt, temperature=0.2, max_output_tokens=50)
    category = result.get("category") if isinstance(result, dict) else None
    return category if category in FOOD_TYPES else None

if __name__ == "__main__":
    for name in ["baby spinach", "chicken thighs", "dragon fruit"]:
        print(f"{name} -> {match_with_ai(name)}")
