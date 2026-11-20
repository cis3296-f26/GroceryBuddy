from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from accounts.authentication import SupabaseAuthentication
from inventory.models import GroceryItem


class GenerationThrottle(UserRateThrottle):
    scope = "ai_generation"
    rate = "5/min"


@method_decorator(never_cache, name="dispatch")
class GenerationView(APIView):
    authentication_classes = (SupabaseAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    throttle_classes = (GenerationThrottle,)
    http_method_names = ["post", "options"]

    def inventory(self, request):
        # Derive ingredients and ownership from the database, never request data.
        if request.data != {}:
            raise ValidationError("Send an empty JSON object; groceries come from your inventory.")
        items = list(GroceryItem.objects.filter(
                        user=request.user, quantity__gt=0, status="available",
        ).order_by("id")[:101])
        if len(items) > 100:
            raise ValidationError("AI generation supports up to 100 active grocery items.")
        if not items:
            raise ValidationError("Add groceries before requesting suggestions.")
        return items
