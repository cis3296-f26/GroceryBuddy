from django.contrib import admin

from .models import GroceryItem


@admin.register(GroceryItem)
class GroceryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "quantity", "category", "storage_location", "expiration_date", "user")
    list_filter = ("category", "storage_location")
    search_fields = ("name", "user__username")
