from django.urls import path

from . import views

urlpatterns = [
    path("session/", views.session, name="session"),
]
