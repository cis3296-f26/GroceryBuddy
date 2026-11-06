from django.contrib import admin  # Django's admin site
from .models import FoodType, GroceryItem  # our tables


@admin.register(GroceryItem)  # show GroceryItem in the admin
class GroceryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "quantity", "category", "storage_location", "expiration_date", "user")  # columns to show
    list_filter = ("category", "storage_location")  # filters on the side
    search_fields = ("name",)  # search by food name


@admin.register(FoodType)  # show FoodType in the admin
class FoodTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "fridge_days", "freezer_days", "pantry_days")  # columns to show
    list_filter = ("category",)  # filter by food group
    search_fields = ("name",)  # search by food name