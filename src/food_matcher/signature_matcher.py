import re

from ai_matcher import match_with_ai

SIGNATURES = {
    "Fruit": [
        "apple", "banana", "orange", "lemon", "lime", "grape", "strawberry",
        "blueberry", "raspberry", "blackberry", "berry", "cherry", "peach",
        "pear", "plum", "mango", "pineapple", "watermelon", "melon",
        "cantaloupe", "kiwi", "avocado", "grapefruit", "dragon fruit",
        "pomegranate", "apricot", "nectarine", "papaya", "fig", "coconut",
    ],
    "Vegetable": [
        "spinach", "lettuce", "kale", "arugula", "cabbage", "broccoli",
        "cauliflower", "carrot", "celery", "cucumber", "tomato", "potato",
        "sweet potato", "onion", "garlic", "pepper", "bell pepper", "zucchini",
        "squash", "eggplant", "mushroom", "corn", "pea", "green bean",
        "asparagus", "beet", "radish", "ginger", "cilantro", "parsley",
        "basil", "scallion", "jalapeno", "salad",
    ],
    "Grain": [
        "rice", "pasta", "spaghetti", "penne", "macaroni", "noodle", "ramen",
        "oat", "oatmeal", "cereal", "granola", "quinoa", "couscous", "flour",
        "barley", "cornmeal",
    ],
    "Protein": [
        "tofu", "tempeh", "seitan", "bean", "black bean", "kidney bean",
        "chickpea", "lentil", "edamame", "hummus",
    ],
    "Dairy": [
        "milk", "cheese", "cheddar", "mozzarella", "parmesan", "yogurt",
        "butter", "cream", "sour cream", "cream cheese", "cottage cheese",
        "ice cream", "ghee", "kefir",
    ],
    "Eggs": [
        "egg", "egg white",
    ],
    "Seafood": [
        "fish", "salmon", "tuna", "cod", "tilapia", "shrimp", "crab",
        "lobster", "scallop", "clam", "mussel", "oyster", "sardine", "anchovy",
    ],
    "Meat": [
        "chicken", "beef", "steak", "pork", "ham", "bacon", "sausage",
        "turkey", "lamb", "veal", "pepperoni", "salami", "hot dog",
        "meatball", "prosciutto", "chorizo",
    ],
    "Beverage": [
        "juice", "soda", "water", "coffee", "tea", "lemonade", "kombucha",
        "beer", "wine", "drink", "almond milk", "oat milk", "soy milk",
        "coconut water", "sparkling water", "energy drink",
    ],
    "Bread": [
        "bread", "bagel", "tortilla", "pita", "bun", "croissant", "baguette",
        "muffin", "english muffin", "naan", "loaf", "toast",
    ],
    "Pantry": [
        "peanut butter", "almond butter", "jam", "jelly", "honey", "syrup",
        "sugar", "salt", "black pepper", "spice", "cinnamon", "oil",
        "olive oil", "vinegar", "ketchup", "mustard", "mayo", "mayonnaise",
        "sauce", "soy sauce", "fish sauce", "hot sauce", "salsa", "broth",
        "stock", "soup", "chip", "cracker", "cookie", "popcorn", "chocolate",
        "nut", "almond", "peanut", "walnut", "cashew", "baking soda",
        "baking powder",
    ],
}

STOP_WORDS = {
    "fresh", "organic", "frozen", "canned", "raw", "cooked", "sliced",
    "diced", "chopped", "shredded", "whole", "large", "small", "medium",
    "boneless", "skinless", "lean", "ground", "low", "fat", "free", "range",
    "reduced", "natural", "plain", "salted", "unsalted",
    "oz", "lb", "lbs", "g", "kg", "ml", "pack", "bag", "box", "can", "jar",
    "bottle", "dozen", "of", "and", "with", "the", "a",
}

LOOKUP = {term: category for category, terms in SIGNATURES.items() for term in terms}


def lookup(words):
    phrase = " ".join(words)
    return LOOKUP.get(phrase) or LOOKUP.get(phrase.removesuffix("s"))


def match_food(food):
    words = [word for word in re.findall(r"[a-z]+", food.lower()) if word not in STOP_WORDS]

    # The end of a name says what the food is, so try "organic almond milk",
    # then "almond milk", then "milk"
    for i in range(len(words)):
        category = lookup(words[i:])
        if category:
            return category

    # Otherwise, any word that matches
    for word in words:
        category = lookup([word])
        if category:
            return category

    return match_with_ai(food).strip()