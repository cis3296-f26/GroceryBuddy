from django.urls import path

from . import views

urlpatterns = [
    path("session/", views.session, name="session"),
    path("login/", views.sign_in, name="sign-in"),
    path("logout/", views.sign_out, name="sign-out"),
]
