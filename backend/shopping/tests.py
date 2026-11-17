import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient, APITestCase

from inventory.models import GroceryItem


class ShoppingGenerationTests(APITestCase):
    client: APIClient
    url = '/api/shopping/generate/'

    def setUp(self):
        self.client = APIClient()
        cache.clear()
        self.user = get_user_model().objects.create_user(username='alice')
        self.other = get_user_model().objects.create_user(username='bob')
        self.client.force_authenticate(self.user)
        GroceryItem.objects.create(user=self.user, name='rice', category='Grain')
        GroceryItem.objects.create(user=self.other, name='private', category='Grain')
        self.result = {'name': 'milk', 'category': 'Dairy', 'quantity': 1, 'reason': 'Try milk.'}
        self.generate = patch('shopping.views.make_shopping_list', return_value=[self.result]).start()
        self.addCleanup(patch.stopall)
        self.addCleanup(cache.clear)

    # Checks that only the user's inventory is sent, history is empty, and uncached results report that limitation.
    def test_current_inventory_only_and_no_fabricated_history(self):
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, 200)
        self.generate.assert_called_once_with([], ['rice'])
        self.assertEqual(json.loads(response.content)['items'], [self.result])
        self.assertFalse(json.loads(response.content)['history_available'])
        self.assertIn('no-store', response['Cache-Control'])

    # Checks that duplicate suggestions and existing grocery names are removed, ignoring case and surrounding spaces.
    def test_existing_and_duplicate_items_are_removed(self):
        self.generate.return_value = [self.result, self.result,
                                      {**self.result, 'name': ' RICE '}]
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(json.loads(response.content)['items'], [self.result])

    # Checks that invalid structure, categories, quantities, or more than 20 suggestions return 502.
    def test_bad_ai_output_is_502(self):
        for result in ({}, [{**self.result, 'category': 'invalid'}],
                       [{**self.result, 'quantity': -1}], [self.result] * 21):
            with self.subTest(result=result):
                self.generate.return_value = result
                self.assertEqual(self.client.post(self.url, {}, format='json').status_code, 502)

    # Checks that signed-out requests return 401 without calling the AI.
    def test_authentication_required(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post(self.url, {}, format='json').status_code, 401)
        self.generate.assert_not_called()
