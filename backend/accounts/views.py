from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET


@never_cache
@require_GET
def session(request):
    user = request.user
    return JsonResponse({
        "user": {"id": user.pk, "username": user.username} if user.is_authenticated else None,
        "csrfToken": get_token(request),
    })
