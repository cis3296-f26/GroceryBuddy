from django.urls import path

from .views import GenerateRecipesView, RecipeChatView

urlpatterns = [
    path("generate/", GenerateRecipesView.as_view(), name="generate-recipes"),
    path("chat/", RecipeChatView.as_view(), name="recipe-chat"),
]
