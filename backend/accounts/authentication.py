from uuid import UUID, uuid4

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import APIException, AuthenticationFailed

from .models import GoogleIdentity, SupabaseIdentity


class AuthUnavailable(APIException):
    status_code = 503
    default_detail = "Account verification is unavailable. Please try again."


def verify_supabase_token(token):
    """Verify with our project's Auth server; never trust client-supplied claims."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_PUBLISHABLE_KEY:
        raise AuthUnavailable("Supabase authentication is not configured on the backend.")
    try:
        response = requests.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
            },
            timeout=(3.05, 10),
            allow_redirects=False,
        )
    except requests.RequestException as exc:
        raise AuthUnavailable() from exc
    if response.status_code in (401, 403):
        raise AuthenticationFailed("Your sign-in has expired. Please sign in again.")
    if response.status_code != 200:
        raise AuthUnavailable()
    try:
        user = response.json()
        if not isinstance(user, dict) or user.get("is_anonymous"):
            raise ValueError("Invalid identity")
        user["id"] = UUID(user["id"])
    except (ValueError, TypeError, KeyError) as exc:
        raise AuthenticationFailed("Invalid account identity.") from exc
    return user


def user_for_supabase_identity(profile):
    subject = profile["id"]
    identity = SupabaseIdentity.objects.select_related("user").filter(subject=subject).first()
    if identity:
        return identity.user

    # Preserve groceries for accounts previously signed in through the Google endpoint.
    # Only the Auth server's verified provider identity can establish this link, never email.
    google_subjects = [
        identity.get("identity_data", {}).get("sub")
        for identity in profile.get("identities", [])
        if identity.get("provider") == "google"
    ]
    try:
        with transaction.atomic():
            google = GoogleIdentity.objects.select_related("user").filter(
                google_sub__in=[sub for sub in google_subjects if isinstance(sub, str)]
            ).first()
            if google:
                user = google.user
            else:
                user = get_user_model()(
                    username=f"supabase_{uuid4().hex}",
                    email=(profile.get("email") or "")[:254],
                )
                user.set_unusable_password()
                user.save()
            SupabaseIdentity.objects.create(subject=subject, user=user)
            return user
    except IntegrityError:
        identity = SupabaseIdentity.objects.select_related("user").filter(subject=subject).first()
        if identity:
            return identity.user
        # Another Supabase account must not claim an already linked Django owner.
        raise AuthenticationFailed("This identity is already linked to another account.")


class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header or header[0].lower() != b"bearer":
            return None
        if len(header) != 2 or len(header[1]) > 16384:
            raise AuthenticationFailed("Invalid authorization header.")
        try:
            token = header[1].decode("ascii")
        except UnicodeDecodeError as exc:
            raise AuthenticationFailed("Invalid authorization header.") from exc
        user = user_for_supabase_identity(verify_supabase_token(token))
        if not user.is_active:
            raise AuthenticationFailed("This account is inactive.")
        return user, None

    def authenticate_header(self, request):
        return "Bearer"
