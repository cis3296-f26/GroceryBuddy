import json

from google import genai
from google.genai import types

MODEL = "gemini-3.5-flash-lite"

def make_recipe(food_items):
    client = genai.Client()
    prompt = "\n".join([
        "You are a cooking assistant for college students who want to use up their groceries before they go bad.",
        "",
        "Create 3 recipes that use as many of the student's food items as possible, focusing on the ones listed first.",
        "Rules:",
        "- Only use the listed items plus basic staples (salt, pepper, oil, butter, water, common spices).",
        "- Keep recipes simple: 30 minutes or less, using only a stovetop, oven or microwave.",
        "- Give each recipe a different cooking method or style.",
        "- Write short, numbered steps a beginner can follow.",
        "- Return only JSON, with no other text.",
        "",
        "Example",
        "Food items: spinach, eggs, cheddar cheese, tortillas",
        "Answer:",
        '[{"name": "Spinach and Cheddar Scramble", "time_minutes": 10,',
        '  "uses": ["spinach", "eggs", "cheddar cheese"],',
        '  "ingredients": ["2 handfuls spinach", "3 eggs", "1/4 cup shredded cheddar", "1 tbsp butter", "salt and pepper"],',
        '  "steps": ["Melt the butter in a pan over medium heat.", "Add the spinach and cook until wilted, about 1 minute.",',
        '            "Whisk the eggs with salt and pepper, pour them in, and stir gently until just set.",',
        '            "Sprinkle the cheddar on top and serve."]},',
        ' {"name": "Crispy Spinach Quesadilla", "time_minutes": 10,',
        '  "uses": ["spinach", "cheddar cheese", "tortillas"],',
        '  "ingredients": ["2 tortillas", "1 handful spinach", "1/2 cup shredded cheddar", "1 tsp oil"],',
        '  "steps": ["Heat the oil in a pan over medium heat.", "Lay one tortilla in the pan and top with cheddar and spinach.",',
        '            "Cover with the second tortilla and cook 2 to 3 minutes per side until golden.", "Cut into wedges and serve."]},',
        ' {"name": "Egg and Cheese Breakfast Wrap", "time_minutes": 8,',
        '  "uses": ["eggs", "cheddar cheese", "tortillas"],',
        '  "ingredients": ["1 tortilla", "2 eggs", "1/4 cup shredded cheddar", "salt and pepper"],',
        '  "steps": ["Whisk the eggs with salt and pepper in a microwave-safe bowl.", "Microwave for 1 minute, stir, then 30 more seconds until set.",',
        '            "Warm the tortilla for 10 seconds.", "Fill with the eggs and cheddar, roll up, and serve."]}]',
        "",
        "Now do the same for these food items, listed from soonest to expire to latest:",
        ", ".join(food_items),
        "Answer:",
    ])
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=2500,
                    response_mime_type="application/json",
        )
    )
    return json.loads(response.text)

if __name__ == "__main__":
    for recipe in make_recipe(["chicken", "broccoli", "rice", "garlic"]):
        print(recipe["name"], "-", recipe["time_minutes"], "min")