from django.core.management.base import BaseCommand  # lets us make our own manage.py command
from inventory.models import FoodType  # the table we are filling

# Numbers come from USDA FoodKeeper: https://www.fsis.usda.gov/shared/data/EN/foodkeeper.json
# We use the low end of each range so estimates stay on the safe side.
# 1 week = 7 days, 1 month = 30 days, 1 year = 365 days.
# None means USDA gives no number of days for that storage place.
# Rice, orange juice, bread, and ketchup only have a fridge number for after opening, so we use that.

# Each line is: (name, category, fridge days, freezer days, pantry days)
FOODS = [
    ("Apples", "Fruit", 28, 240, 21),
    ("Bananas", "Fruit", 3, 60, None),
    ("Oranges", "Fruit", 10, None, 10),
    ("Strawberries", "Fruit", 2, 240, None),
    ("Lettuce", "Vegetable", 7, None, None),
    ("Spinach", "Vegetable", 3, None, None),
    ("Potatoes", "Vegetable", 7, None, 30),
    ("Onions", "Vegetable", 60, 300, 30),
    ("Carrots", "Vegetable", 14, 300, None),
    ("Broccoli", "Vegetable", 3, 300, None),
    ("White rice", "Grain", 180, None, 730),
    ("Pasta", "Grain", None, None, 730),
    ("Cereal", "Grain", None, None, 180),
    ("Tofu", "Protein", 7, 150, None),
    ("Dried beans", "Protein", None, None, 365),
    ("Milk", "Dairy", None, 90, None),
    ("Butter", "Dairy", 30, 180, None),
    ("Yogurt", "Dairy", 7, 30, None),
    ("Cheddar cheese", "Dairy", 180, 180, None),
    ("Eggs", "Eggs", 21, None, None),
    ("Salmon", "Seafood", 1, 60, None),
    ("Shrimp", "Seafood", 1, 180, None),
    ("Chicken breast", "Meat", 1, 270, None),
    ("Ground beef", "Meat", 1, 90, None),
    ("Pork chops", "Meat", 3, 120, None),
    ("Bacon", "Meat", 7, 30, None),
    ("Orange juice", "Beverage", 7, 240, None),
    ("Bread", "Bread", 14, 90, 14),
    ("Peanut butter", "Pantry", None, None, 180),
    ("Ketchup", "Pantry", 180, None, 365),
]


class Command(BaseCommand):
    help = "Loads common foods and their shelf life into the FoodType table"  # shows in manage.py help

    def handle(self, *args, **options):
        for name, category, fridge_days, freezer_days, pantry_days in FOODS:  # go through each food
            FoodType.objects.update_or_create(  # add the food, or update it if it's already there
                name=name,  # this is how we find the food
                defaults={  # these are the values to save
                    "category": category,
                    "fridge_days": fridge_days,
                    "freezer_days": freezer_days,
                    "pantry_days": pantry_days,
                },
            )
        self.stdout.write(f"Loaded {len(FOODS)} foods")  # tell us it worked