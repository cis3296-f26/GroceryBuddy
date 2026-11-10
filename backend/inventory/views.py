from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import GroceryItem
from .serializers import GroceryItemSerializer


class GroceryItemViewSet(ModelViewSet):
    serializer_class = GroceryItemSerializer
    permission_classes = (IsAuthenticated,)
    # Session authentication supports the browsable API and enforces CSRF on writes.
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return GroceryItem.objects.filter(user=self.request.user).order_by("id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
