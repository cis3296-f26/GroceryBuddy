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
