from rest_framework.response import Response

from grocery_buddy.ai import InvalidAIResponse
from grocery_buddy.ai_views import GenerationView

from .serializers import ShoppingSuggestionSerializer
from .services.shopping_list_maker import make_shopping_list

# Handles shopping suggestion requests.
class GenerateShoppingView(GenerationView):
    def post(self, request):
        names = [item.name for item in self.inventory(request)]
        # Used/Tossed currently delete items. Do not invent purchase history.
        result = make_shopping_list([], names)
        if not isinstance(result, list) or len(result) > 20:
            raise InvalidAIResponse()
        serializer = ShoppingSuggestionSerializer(data=result, many=True)
        if not serializer.is_valid():
            raise InvalidAIResponse()
        current = {name.strip().casefold() for name in names}
        seen = set()
        suggestions = []
        for item in serializer.validated_data:
            key = item["name"].casefold()
            if key not in current and key not in seen:
                suggestions.append(item)
                seen.add(key)
        return Response({
            "items": suggestions,
            "history_available": False,
            "detail": "Suggestions use current inventory only; used/tossed history is not recorded yet.",
        })
