from rest_framework.routers import DefaultRouter

from .views import GroceryItemViewSet

router = DefaultRouter()
router.register("items", GroceryItemViewSet, basename="groceryitem")
urlpatterns = router.urls
