from django.contrib import admin  # Django's admin site
from .models import FoodType, GroceryItem  # our tables
from .services.expiration import get_status  # our expiration engine


@admin.register(GroceryItem)  # show GroceryItem in the admin
class GroceryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "quantity", "category", "storage_location", "expiration_date", "use_by", "label", "user")  # columns to show
    list_filter = ("category", "storage_location")  # filters on the side
    search_fields = ("name", "user__username")  # search by food or owner

    @admin.display(description="Use by")  # column title
    def use_by(self, item):
        status = get_status(item)  # ask the engine about this item
        if status["use_by_date"] is None:  # no package date and no estimate
            return "No date"
        if status["is_estimate"]:  # we guessed it from the FoodType days
            return f"{status['use_by_date']} (estimate)"
        return status["use_by_date"]  # the package date the student typed

    @admin.display(description="Label")  # column title
    def label(self, item):
        return get_status(item)["label_name"]  # like "Use Soon"


@admin.register(FoodType)  # show FoodType in the admin
class FoodTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "fridge_days", "freezer_days", "pantry_days")  # columns to show
    list_filter = ("category",)  # filter by food group
    search_fields = ("name",)  # search by food name