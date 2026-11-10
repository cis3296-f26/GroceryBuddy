import json
import secrets
import time

from django.conf import settings
from django.contrib.auth import login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST
from google.auth.exceptions import GoogleAuthError

from .services import user_for_google_identity, verify_google_token

NONCE_SESSION_KEY = "google_login_nonce"
NONCE_LIFETIME = 600


def user_data(user):
    return {
        "id": user.pk,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


@never_cache
@require_GET
def auth_config(request):
    """Bootstrap CSRF and bind a Google sign-in challenge to this browser."""
    if not settings.GOOGLE_CLIENT_ID:
        return JsonResponse({"detail": "Google sign-in is not configured."}, status=503)
    nonce = secrets.token_urlsafe(32)
    request.session[NONCE_SESSION_KEY] = {"value": nonce, "issued_at": time.time()}
    return JsonResponse({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "nonce": nonce,
        "csrf_token": get_token(request),
    })


@never_cache
@require_POST
@csrf_protect
def google_login(request):
    # A plain Django view deliberately enforces CSRF even before authentication.
    if not settings.GOOGLE_CLIENT_ID:
        return JsonResponse({"detail": "Google sign-in is not configured."}, status=503)
    if request.content_type != "application/json":
        return JsonResponse({"detail": "Send application/json."}, status=415)
    try:
        payload = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"detail": "Invalid JSON."}, status=400)
    credential = payload.get("credential") if isinstance(payload, dict) else None
    if not isinstance(credential, str) or not credential or len(credential) > 16384:
        return JsonResponse({"detail": "A Google ID token credential is required."}, status=400)

    challenge = request.session.get(NONCE_SESSION_KEY)
    if not challenge or not 0 <= time.time() - challenge["issued_at"] <= NONCE_LIFETIME:
        return JsonResponse({"detail": "Restart Google sign-in."}, status=401)
    try:
        claims = verify_google_token(credential)
    except ValueError:
        return JsonResponse({"detail": "Invalid or expired Google ID token."}, status=401)
    except GoogleAuthError:
        return JsonResponse({"detail": "Google verification is unavailable. Try again."}, status=503)

    nonce = claims.get("nonce")
    subject = claims.get("sub")
    email = claims.get("email")
    if (
        not isinstance(nonce, str)
        or not secrets.compare_digest(nonce.encode(), challenge["value"].encode())
        or not isinstance(subject, str) or not subject or len(subject) > 255
        or not isinstance(email, str) or not email or len(email) > 254
        or claims.get("email_verified") is not True
    ):
        return JsonResponse({"detail": "Invalid Google identity or sign-in challenge."}, status=401)

    user = user_for_google_identity(claims)
    if not user.is_active:
        return JsonResponse({"detail": "This account is inactive."}, status=403)
    request.session.pop(NONCE_SESSION_KEY, None)
    login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    # Django rotates the CSRF token on login; return the new value for API writes.
    return JsonResponse({"user": user_data(user), "csrf_token": get_token(request)})


@never_cache
@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    return JsonResponse({"user": user_data(request.user), "csrf_token": get_token(request)})


@never_cache
@require_POST
@csrf_protect
def session_logout(request):
    logout(request)
    return JsonResponse({"detail": "Signed out.", "csrf_token": get_token(request)})


@never_cache
@require_GET
def session(request):
    user = request.user
    return JsonResponse({
        "user": {"id": user.pk, "username": user.username} if user.is_authenticated else None,
        "csrfToken": get_token(request),
    })
