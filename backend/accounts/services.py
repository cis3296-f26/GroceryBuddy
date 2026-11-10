from functools import partial
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from google.auth.transport.requests import Request
from google.oauth2 import id_token

from .models import GoogleIdentity


def verify_google_token(credential):
    # Google's library checks the signature, audience, issuer, and lifetime.
    return id_token.verify_oauth2_token(
        credential,
        partial(Request(), timeout=10),
        audience=settings.GOOGLE_CLIENT_ID,
    )


def user_for_google_identity(claims):
    """Resolve by Google's subject, never automatically link by email."""
    subject = claims["sub"]
    identity = GoogleIdentity.objects.select_related("user").filter(google_sub=subject).first()
    if identity:
        return identity.user

    try:
        with transaction.atomic():
            user = get_user_model()(
                username=f"google_{uuid4().hex}",
                email=claims["email"],
                first_name=claims.get("given_name", "")[:150],
                last_name=claims.get("family_name", "")[:150],
            )
            user.set_unusable_password()
            user.save()
            GoogleIdentity.objects.create(user=user, google_sub=subject)
            return user
    except IntegrityError:
        # A simultaneous first login may have inserted the same subject.
        # The losing transaction also rolls back its newly created user.
        identity = GoogleIdentity.objects.select_related("user").filter(google_sub=subject).first()
        if identity:
            return identity.user
        raise
