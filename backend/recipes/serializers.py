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


class ChatTurnSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField(max_length=6000)


class RecipeChatSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=500)
    history = ChatTurnSerializer(many=True, max_length=10, required=False, default=list)

    def to_internal_value(self, data):
        if isinstance(data, dict) and set(data) - {'message', 'history'}:
            raise serializers.ValidationError({'detail': 'Send only message and history.'})
        return super().to_internal_value(data)
