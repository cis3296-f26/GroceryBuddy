from django.urls import path

from . import views

app_name = "accounts"
urlpatterns = [
    path("google/config/", views.auth_config, name="google-config"),
    path("google/", views.google_login, name="google-login"),
    path("me/", views.current_user, name="me"),
    path("logout/", views.session_logout, name="logout"),
]
