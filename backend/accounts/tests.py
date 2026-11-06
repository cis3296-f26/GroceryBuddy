from django.contrib.auth import get_user_model
from django.test import Client, TestCase


class SessionTests(TestCase):
    def test_session_login_logout_and_csrf(self):
        get_user_model().objects.create_user(username="alice", password="test-password")
        client = Client(enforce_csrf_checks=True)
        session = client.get("/api/accounts/session/").json()
        self.assertIsNone(session["user"])
        credentials = {"username": "alice", "password": "test-password"}
        self.assertEqual(client.post("/api/accounts/login/", credentials, content_type="application/json").status_code, 403)
        response = client.post("/api/accounts/login/", credentials, content_type="application/json", HTTP_X_CSRFTOKEN=session["csrfToken"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["username"], "alice")
        self.assertEqual(client.get("/api/inventory/items/").status_code, 200)
        self.assertEqual(client.post("/api/accounts/logout/").status_code, 403)
        self.assertEqual(client.post("/api/accounts/logout/", HTTP_X_CSRFTOKEN=response.json()["csrfToken"]).status_code, 200)
        self.assertEqual(client.get("/api/inventory/items/").status_code, 403)

    def test_invalid_credentials(self):
        response = self.client.post("/api/accounts/login/", {"username": "missing", "password": "wrong"}, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIsNone(self.client.get("/api/accounts/session/").json()["user"])
