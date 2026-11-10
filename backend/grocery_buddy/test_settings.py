"""Isolated PostgreSQL tests; never use the shared application's connection."""

import os

# Supply harmless defaults before importing settings so tests need no .env file.
os.environ.setdefault("SECRET_KEY", "inventory-tests-only-secret-key")
os.environ.setdefault("DATABASE_URL", "postgresql://localhost/grocerybuddy_test_config")

from .settings import *  # noqa: F403,E402

_test_url = os.environ.get("TEST_DATABASE_URL")
if not _test_url:
    raise ValueError("Set TEST_DATABASE_URL to a dedicated PostgreSQL test server.")

DATABASES = {"default": dj_database_url.parse(_test_url, conn_max_age=0)}
if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":
    raise ValueError("TEST_DATABASE_URL must use PostgreSQL.")

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
