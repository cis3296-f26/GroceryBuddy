from rest_framework import serializers

from inventory.models import CATEGORY_CHOICES

# Defines a valid shopping suggestion.
class ShoppingSuggestionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    category = serializers.ChoiceField(choices=CATEGORY_CHOICES)
    quantity = serializers.IntegerField(min_value=1, max_value=100)
    reason = serializers.CharField(max_length=500)
