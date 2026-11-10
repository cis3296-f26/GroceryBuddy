"""Run tests on PostgreSQL using the connection configured in backend/.env.

Django creates a separate test_<database name> database on that server and
removes it after the run. The database role must have CREATEDB permission.
"""
from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403

if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":  # noqa: F405
    raise ImproperlyConfigured("Inventory tests require a PostgreSQL DATABASE_URL.")

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
