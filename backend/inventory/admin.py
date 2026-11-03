from django.contrib import admin  # Django's admin site
from .models import GroceryItem  # our grocery table


@admin.register(GroceryItem)  # show GroceryItem in the admin
class GroceryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "quantity", "category", "storage_location", "expiration_date", "user")  # columns to show
    list_filter = ("category", "storage_location")  # filters on the side
    search_fields = ("name",)  # search by food name