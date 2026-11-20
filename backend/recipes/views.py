from datetime import date

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from grocery_buddy.ai import InvalidAIResponse
from grocery_buddy.ai_views import GenerationView
from inventory.services.expiration import sort_by_urgency

from .serializers import RecipeSerializer
from .services.recipe_maker import make_recipe

#Handles recipe requests.
class GenerateRecipesView(GenerationView):
    def post(self, request):
        statuses = sort_by_urgency(self.inventory(request))
        names = [status["item"].name for status in statuses
                 if status["use_by_date"] is None or status["use_by_date"] >= date.today()]
        if not names:
            raise ValidationError("No groceries within their use-by date are available for recipes.")
        result = make_recipe(names)
        if not isinstance(result, list) or not 1 <= len(result) <= 3:
            raise InvalidAIResponse()
        serializer = RecipeSerializer(data=result, many=True)
        if not serializer.is_valid():
            raise InvalidAIResponse()
        allowed = {name.casefold() for name in names}
        if any(name.casefold() not in allowed
               for recipe in serializer.validated_data for name in recipe["uses"]):
            raise InvalidAIResponse()
        return Response({"recipes": serializer.validated_data})


class RecipeChatView(GenerationView):
    def post(self, request):
        from inventory.models import GroceryItem
        from .serializers import RecipeChatSerializer
        from .services.recipe_chat import reply_to_recipe_chat

        serializer = RecipeChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = list(GroceryItem.objects.filter(
            user=request.user, quantity__gt=0,
        ).order_by('id')[:101])
        if len(items) > 100:
            raise ValidationError('AI chat supports up to 100 active grocery items.')
        inventory = [
            {
                'name': status['item'].name,
                'quantity': status['item'].quantity,
                'storage': status['item'].storage_location,
                'use_by_date': str(status['use_by_date']) if status['use_by_date'] else None,
                'estimated': status['is_estimate'],
                'status': status['label'],
            }
            for status in sort_by_urgency(items)
            if status['use_by_date'] is None or status['use_by_date'] >= date.today()
        ]
        result = reply_to_recipe_chat(
            serializer.validated_data['message'], serializer.validated_data['history'], inventory,
        )
        if (not isinstance(result, dict) or not isinstance(result.get('reply'), str)
                or not result['reply'].strip() or len(result['reply']) > 6000):
            raise InvalidAIResponse()
        return Response({'reply': result['reply'].strip()})
