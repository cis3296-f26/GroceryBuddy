from django.contrib import admin
from django.urls import include, path

from .views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/accounts/", include("accounts.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/recipes/", include("recipes.urls")),
    path("api/shopping/", include("shopping.urls")),
]