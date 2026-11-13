import json

from google import genai
from google.genai import types

MODEL = "gemini-3.5-flash-lite"

FOOD_TYPES = ["Fruit", "Vegetable", "Grain", "Protein", "Dairy", "Eggs", "Seafood", "Beverage", "Meat", "Bread", "Pantry"]

def format_history(history):
    return "\n".join(
        f"- {item['name']} ({item['category']}): bought {item['purchase_date']}, finished {item['finished_date']}, {item['outcome']}"
        for item in history
    )

def make_shopping_list(history, current_items):
    client = genai.Client()
    prompt = "\n".join([
        "You are a shopping assistant for college students who want to buy what they need without wasting food.",
        "",
        "Create a shopping list based on the student's grocery history and what they have right now.",
        "Rules:",
        "- Suggest foods they buy often and have run out of.",
        "- Don't suggest foods they already have.",
        "- For foods they often toss, suggest a smaller quantity or skip them.",
        "- Add at most 2 new foods that go well with what they usually buy.",
        "- Use only these categories: " + ", ".join(FOOD_TYPES) + ".",
        "- Give a short reason for each suggestion.",
        "- Return only JSON, with no other text.",
        "",
        "Example",
        "History:",
        "- milk (Dairy): bought 2026-11-01, finished 2026-11-07, used",
        "- milk (Dairy): bought 2026-11-08, finished 2026-11-14, used",
        "- spinach (Vegetable): bought 2026-11-02, finished 2026-11-10, tossed",
        "- spinach (Vegetable): bought 2026-11-09, finished 2026-11-16, tossed",
        "- eggs (Eggs): bought 2026-11-01, finished 2026-11-12, used",
        "Current items: eggs",
        "Answer:",
        '[{"name": "milk", "category": "Dairy", "quantity": 1,',
        '  "reason": "You buy milk about once a week and always finish it."},',
        ' {"name": "spinach", "category": "Vegetable", "quantity": 1,',
        '  "reason": "You tossed your last two bags, so try a smaller bag this time."},',
        ' {"name": "oatmeal", "category": "Grain", "quantity": 1,',
        '  "reason": "Goes well with the milk you buy every week."}]',
        "",
        "Now do the same for this student.",
        "History:",
        format_history(history),
        "Current items: " + (", ".join(current_items) or "none"),
        "Answer:",
    ])
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.5,
            max_output_tokens=1500,
            response_mime_type="application/json",
        )
    )
    return json.loads(response.text)

if __name__ == "__main__":
    history = [
        {"name": "bread", "category": "Bread", "purchase_date": "2026-11-01", "finished_date": "2026-11-06", "outcome": "used"},
        {"name": "bread", "category": "Bread", "purchase_date": "2026-11-07", "finished_date": "2026-11-12", "outcome": "used"},
        {"name": "chicken", "category": "Meat", "purchase_date": "2026-11-03", "finished_date": "2026-11-05", "outcome": "used"},
        {"name": "strawberries", "category": "Fruit", "purchase_date": "2026-11-03", "finished_date": "2026-11-09", "outcome": "tossed"},
        {"name": "yogurt", "category": "Dairy", "purchase_date": "2026-11-04", "finished_date": "2026-11-11", "outcome": "used"},
    ]
    for item in make_shopping_list(history, ["chicken", "rice"]):
        print(item["name"], "x", item["quantity"], "-", item["reason"])
