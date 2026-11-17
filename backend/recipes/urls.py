from django.urls import path

from .views import GenerateRecipesView

urlpatterns = [path("generate/", GenerateRecipesView.as_view(), name="generate-recipes")]
