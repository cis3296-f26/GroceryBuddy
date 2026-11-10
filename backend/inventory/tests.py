from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from .models import GroceryItem


class GroceryItemAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="alice", password="test")
        self.other = get_user_model().objects.create_user(username="bob", password="test")
        self.payload = {
            "name": "Milk", "quantity": 2, "category": "Dairy",
            "purchase_date": "2026-11-03", "expiration_date": "2026-11-10",
            "storage_location": "fridge",
        }
        self.item = GroceryItem.objects.create(user=self.other, **self.payload)
        self.url = "/api/inventory/items/"
        self.client.force_authenticate(self.user)

    def test_authentication_required(self):
        self.client.force_authenticate(None)
        for method in (self.client.get, self.client.post):
            self.assertIn(method(self.url).status_code, (401, 403))

    def test_create_assigns_authenticated_owner(self):
        response = self.client.post(self.url, {**self.payload, "user": self.other.pk})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(GroceryItem.objects.get(pk=response.data["id"]).user, self.user)

    def test_list_only_own_items(self):
        own = GroceryItem.objects.create(user=self.user, **self.payload)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [own.pk])

    def test_other_users_items_are_inaccessible(self):
        detail = f"{self.url}{self.item.pk}/"
        self.assertEqual(self.client.get(detail).status_code, 404)
        self.assertEqual(self.client.patch(detail, {"quantity": 0}).status_code, 404)
        self.assertEqual(self.client.delete(detail).status_code, 404)
        self.assertTrue(GroceryItem.objects.filter(pk=self.item.pk).exists())

    def test_update_and_delete_own_item(self):
        own = GroceryItem.objects.create(user=self.user, **self.payload)
        detail = f"{self.url}{own.pk}/"
        response = self.client.patch(detail, {"quantity": 0, "user": self.other.pk})
        self.assertEqual(response.status_code, 200)
        own.refresh_from_db()
        self.assertEqual(own.quantity, 0)
        self.assertEqual(own.user, self.user)
        self.assertEqual(self.client.delete(detail).status_code, 204)
        self.assertFalse(GroceryItem.objects.filter(pk=own.pk).exists())

    def test_invalid_input(self):
        for change in ({"quantity": -1}, {"quantity": 1.5}, {"name": ""},
                       {"name": "x" * 101}, {"purchase_date": "invalid"},
                       {"category": "invalid"}, {"storage_location": "invalid"}):
            with self.subTest(change=change):
                self.assertEqual(self.client.post(self.url, {**self.payload, **change}).status_code, 400)

    def test_expiration_is_optional(self):
        payload = self.payload.copy()
        del payload["expiration_date"]
        self.assertEqual(self.client.post(self.url, payload).status_code, 201)

    def test_retrieve_and_replace_own_item(self):
        own = GroceryItem.objects.create(user=self.user, **self.payload)
        detail = f"{self.url}{own.pk}/"
        self.assertEqual(self.client.get(detail).data["id"], own.pk)
        response = self.client.put(detail, {**self.payload, "name": "Eggs"})
        self.assertEqual(response.status_code, 200)
        own.refresh_from_db()
        self.assertEqual(own.name, "Eggs")
        self.assertEqual(own.user, self.user)
        self.assertEqual(self.client.put(f"{self.url}{self.item.pk}/", self.payload).status_code, 404)

    def test_create_defaults(self):
        from datetime import date

        response = self.client.post(self.url, {"name": "Milk", "category": "Dairy"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["quantity"], 1)
        self.assertEqual(response.data["storage_location"], "fridge")
        self.assertEqual(response.data["purchase_date"], date.today().isoformat())
        self.assertIsNone(response.data["expiration_date"])

    def test_session_writes_require_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(self.user)
        self.assertEqual(client.get(self.url).status_code, 200)
        self.assertEqual(client.post(self.url, self.payload).status_code, 403)
        client.get("/api/auth/login/")
        token = client.cookies["csrftoken"].value
        response = client.post(self.url, self.payload, HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(GroceryItem.objects.get(pk=response.data["id"]).user, self.user)
