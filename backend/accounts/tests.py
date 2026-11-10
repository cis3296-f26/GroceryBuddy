from django.contrib.auth import get_user_model
from django.test import Client, TestCase


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
