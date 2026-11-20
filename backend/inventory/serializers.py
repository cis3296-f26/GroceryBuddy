from rest_framework import serializers

from .models import GroceryItem


class GroceryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryItem
        fields = (
            "id", "name", "quantity", "category", "purchase_date",
            "expiration_date", "storage_location", "user",
        )
        read_only_fields = ("id", "user")
        # Leave category out to have the matcher pick it from the name.
        extra_kwargs = {"category": {"required": False}}
