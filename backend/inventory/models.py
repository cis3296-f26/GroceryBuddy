from datetime import date  # lets us use today's date
from django.conf import settings  # gets Django's user model
from django.db import models  # tools for making database tables

# Food groups (same as Othmane's list)
CATEGORY_CHOICES = [
    ("Fruit", "Fruit"),
    ("Vegetable", "Vegetable"),
    ("Grain", "Grain"),
    ("Protein", "Protein"),
    ("Dairy", "Dairy"),
    ("Eggs", "Eggs"),
    ("Seafood", "Seafood"),
    ("Beverage", "Beverage"),
    ("Meat", "Meat"),
    ("Bread", "Bread"),
    ("Pantry", "Pantry"),
]

# Where the food is kept
STORAGE_CHOICES = [
    ("fridge", "Fridge"),
    ("freezer", "Freezer"),
    ("pantry", "Pantry"),
]


class GroceryItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # links to Django's built-in user
        on_delete=models.CASCADE,  # delete user = delete their groceries
        related_name="grocery_items",  # lets us do user.grocery_items
    )
    name = models.CharField(max_length=100)  # food name, like "Milk"
    quantity = models.PositiveIntegerField(default=1)  # how many (can't be negative)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)  # food group
    purchase_date = models.DateField(default=date.today)  # day it was bought
    expiration_date = models.DateField(null=True, blank=True)  # package date (can be empty)
    storage_location = models.CharField(max_length=10, choices=STORAGE_CHOICES, default="fridge")  # fridge, freezer, or pantry

    class Meta:
        ordering = ["expiration_date"]  # soonest date shows first

    def __str__(self):
        return f"{self.name} ({self.quantity})"  # how it shows in the admin