from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from google.auth.exceptions import TransportError
from rest_framework.test import APIClient

from .models import GoogleIdentity
from .services import verify_google_token


@override_settings(
    GOOGLE_CLIENT_ID="test-client.apps.googleusercontent.com",
    SESSION_COOKIE_SECURE=False,
    CSRF_COOKIE_SECURE=False,
)
class GoogleLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.login_url = reverse("accounts:google-login")
        self.config = self.client.get(reverse("accounts:google-config")).json()
        self.claims = {
            "sub": "google-subject-123", "email": "alice@example.com",
            "email_verified": True, "given_name": "Alice", "family_name": "Smith",
            "nonce": self.config["nonce"],
        }
        self.verifier = patch("accounts.views.verify_google_token", return_value=self.claims)
        self.verify = self.verifier.start()
        self.addCleanup(self.verifier.stop)

    def sign_in(self, payload=None):
        return self.client.post(
            self.login_url, payload if payload is not None else {"credential": "google-token"},
            format="json", HTTP_X_CSRFTOKEN=self.config["csrf_token"],
        )

    def test_first_login_creates_user_and_authenticated_session(self):
        response = self.sign_in()
        self.assertEqual(response.status_code, 200)
        user = get_user_model().objects.get(pk=response.json()["user"]["id"])
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertEqual(user.google_identity.google_sub, self.claims["sub"])
        self.assertEqual(self.client.get(reverse("accounts:me")).json()["user"]["id"], user.pk)

    def test_returning_user_uses_subject_even_if_email_changes(self):
        first = self.sign_in().json()["user"]["id"]
        self.config = self.client.get(reverse("accounts:google-config")).json()
        self.claims.update(nonce=self.config["nonce"], email="changed@example.com")
        self.assertEqual(self.sign_in().json()["user"]["id"], first)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_does_not_link_by_email(self):
        existing = get_user_model().objects.create_user(username="existing", email=self.claims["email"])
        response = self.sign_in()
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.json()["user"]["id"], existing.pk)
        self.assertFalse(GoogleIdentity.objects.filter(user=existing).exists())

    def test_login_requires_csrf_before_authentication(self):
        response = self.client.post(self.login_url, {"credential": "token"}, format="json")
        self.assertEqual(response.status_code, 403)
        self.verify.assert_not_called()

    def test_invalid_token(self):
        self.verify.side_effect = ValueError("bad token")
        self.assertEqual(self.sign_in().status_code, 401)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_verification_network_failure(self):
        self.verify.side_effect = TransportError("network unavailable")
        self.assertEqual(self.sign_in().status_code, 503)

    def test_invalid_claims(self):
        for change in ({"nonce": "wrong"}, {"email_verified": False}, {"sub": ""}):
            with self.subTest(change=change):
                self.verify.return_value = {**self.claims, **change}
                self.assertEqual(self.sign_in().status_code, 401)
        self.assertFalse(GoogleIdentity.objects.exists())

    def test_expired_challenge(self):
        session = self.client.session
        session["google_login_nonce"] = {"value": self.claims["nonce"], "issued_at": 0}
        session.save()
        self.assertEqual(self.sign_in().status_code, 401)
        self.verify.assert_not_called()

    def test_challenge_is_consumed(self):
        response = self.sign_in()
        self.assertEqual(response.status_code, 200)
        self.config["csrf_token"] = response.json()["csrf_token"]
        self.assertEqual(self.sign_in().status_code, 401)

    def test_inactive_user_cannot_login(self):
        user = get_user_model().objects.create_user(username="inactive", is_active=False)
        GoogleIdentity.objects.create(user=user, google_sub=self.claims["sub"])
        self.assertEqual(self.sign_in().status_code, 403)
        self.assertEqual(self.client.get(reverse("accounts:me")).status_code, 401)

    def test_logout_requires_csrf_and_ends_session(self):
        response = self.sign_in()
        url = reverse("accounts:logout")
        self.assertEqual(self.client.post(url).status_code, 403)
        self.assertEqual(self.client.get(url).status_code, 405)
        response = self.client.post(url, HTTP_X_CSRFTOKEN=response.json()["csrf_token"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(reverse("accounts:me")).status_code, 401)
        self.assertIn(self.client.get("/api/inventory/items/").status_code, (401, 403))

    def test_invalid_request_body(self):
        for payload in ({}, {"credential": 123}, ["token"]):
            with self.subTest(payload=payload):
                self.assertEqual(self.sign_in(payload).status_code, 400)
        self.assertEqual(self.client.post(self.login_url, "{", content_type="application/json",
            HTTP_X_CSRFTOKEN=self.config["csrf_token"]).status_code, 400)

    @override_settings(GOOGLE_CLIENT_ID="")
    def test_missing_configuration(self):
        self.assertEqual(self.client.get(reverse("accounts:google-config")).status_code, 503)
        self.assertEqual(self.sign_in().status_code, 503)

    def test_verifier_passes_configured_audience(self):
        with patch("accounts.services.id_token.verify_oauth2_token", return_value=self.claims) as verify:
            self.assertEqual(verify_google_token("token"), self.claims)
            self.assertEqual(verify.call_args.kwargs["audience"], "test-client.apps.googleusercontent.com")


class SessionTests(TestCase):
    def test_anonymous_session_bootstraps_csrf(self):
        client = Client(enforce_csrf_checks=True)
        response = client.get("/api/accounts/session/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["user"])
        self.assertTrue(response.json()["csrfToken"])
        self.assertIn("csrftoken", client.cookies)
        self.assertIn("no-store", response["Cache-Control"])

    def test_authenticated_session_allows_csrf_protected_grocery_write(self):
        user = get_user_model().objects.create_user(username="alice")
        client = Client(enforce_csrf_checks=True)
        client.force_login(user)
        response = client.get("/api/accounts/session/")
        self.assertEqual(response.json()["user"], {"id": user.pk, "username": "alice"})
        payload = {"name": "Milk", "category": "Dairy"}
        self.assertEqual(client.post("/api/inventory/items/", payload).status_code, 403)
        response = client.post("/api/inventory/items/", payload,
                               HTTP_X_CSRFTOKEN=response.json()["csrfToken"])
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"], user.pk)
