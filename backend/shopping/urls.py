from django.urls import path

from .views import GenerateShoppingView

urlpatterns = [path("generate/", GenerateShoppingView.as_view(), name="generate-shopping")]
