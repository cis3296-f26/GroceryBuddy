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

# What happened to the food
STATUS_CHOICES = [
    ("available", "Available"),
    ("used", "Used"),
    ("tossed", "Tossed"),
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
    unit = models.CharField(max_length=20, blank=True, default="", db_default="")  # like "carton" or "lb" (can be empty)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="available", db_default="available")  # available, used, or tossed

    class Meta:
        ordering = ["expiration_date"]  # soonest date shows first

    def __str__(self):
        return f"{self.name} ({self.quantity})"  # how it shows in the admin


class FoodType(models.Model):
    name = models.CharField(max_length=100, unique=True)  # food name, like "Eggs"
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)  # food group
    fridge_days = models.PositiveIntegerField(null=True, blank=True)  # days it lasts in the fridge
    freezer_days = models.PositiveIntegerField(null=True, blank=True)  # days it lasts in the freezer
    pantry_days = models.PositiveIntegerField(null=True, blank=True)  # days it lasts in the pantry

    class Meta:
        ordering = ["name"]  # sort foods A to Z

    def __str__(self):
        return self.name  # how it shows in the admin