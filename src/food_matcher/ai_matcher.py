from google import genai
from google.genai import types

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

MODEL = "gemini-3.5-flash-lite"

def match_with_ai (food):
    client = genai.Client()
    prompt = (
            "You are an AI assistant that helps users identify food types.\n"
            "Pick the one food type that you think best matches the given food item from the list below.\n"
            "If none match, specify 'None'\n"
            f"Food item: {food}\n"
            f"Food types: {', '.join(FOOD_TYPES)}\n"
            "Don't provide any explanation, just return the food type.")
    
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=50,
        ),
    )

    
    return response.text

if __name__ == "__main__":
    for name in ["baby spinach", "chicken thighs", "dragon fruit"]:
        print(f"{name} -> {match_with_ai(name)}")