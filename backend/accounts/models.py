from django.conf import settings
from django.db import models


class GoogleIdentity(models.Model):
    """Links a Google account to the existing Django user; stores no tokens."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="google_identity",
    )
    google_sub = models.CharField(max_length=255, unique=True)


class SupabaseIdentity(models.Model):
    """Stable mapping from the configured Supabase project to a Django owner."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="supabase_identity",
    )
    subject = models.UUIDField(unique=True)
