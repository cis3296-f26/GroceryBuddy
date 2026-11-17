from rest_framework import serializers

# Defines a valid recipe response.
class RecipeSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    time_minutes = serializers.IntegerField(min_value=1, max_value=30)
    uses = serializers.ListField(
        child=serializers.CharField(max_length=100), min_length=1, max_length=100,
    )
    ingredients = serializers.ListField(
        child=serializers.CharField(max_length=300), min_length=1, max_length=100,
    )
    steps = serializers.ListField(
        child=serializers.CharField(max_length=1000), min_length=1, max_length=30,
    )
