import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST


def session_data(request):
    user = request.user
    return {
        "user": {"id": user.pk, "username": user.username} if user.is_authenticated else None,
        "csrfToken": get_token(request),
    }


@require_GET
def session(request):
    return JsonResponse(session_data(request))


@require_POST
@csrf_protect
def sign_in(request):
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"detail": "Invalid JSON."}, status=400)
    if not isinstance(data, dict) or not all(isinstance(data.get(key), str) for key in ("username", "password")):
        return JsonResponse({"detail": "Enter your username and password."}, status=400)
    user = authenticate(request, username=data["username"], password=data["password"])
    if user is None:
        return JsonResponse({"detail": "Incorrect username or password."}, status=400)
    login(request, user)
    return JsonResponse(session_data(request))


@require_POST
@csrf_protect
def sign_out(request):
    logout(request)
    return JsonResponse(session_data(request))
