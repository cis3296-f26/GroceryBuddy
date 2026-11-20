import json
from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APIClient, APITestCase

from grocery_buddy.ai import AIUnavailable
from inventory.models import FoodType, GroceryItem


class RecipeGenerationTests(APITestCase):
    client: APIClient
    url = '/api/recipes/generate/'

    def setUp(self):
        self.client = APIClient()
        cache.clear()
        self.user = get_user_model().objects.create_user(username='alice')
        self.other = get_user_model().objects.create_user(username='bob')
        self.client.force_authenticate(self.user)
        self.item = GroceryItem.objects.create(
            user=self.user, name='rice', category='Grain',
            expiration_date=date.today() + timedelta(days=5),
        )
        self.result = [{
            'name': 'Rice bowl', 'time_minutes': 10, 'uses': ['rice'],
            'ingredients': ['rice', 'water'], 'steps': ['Cook the rice.'],
        }]
        self.generate = patch('recipes.views.make_recipe', return_value=self.result).start()
        self.addCleanup(patch.stopall)
        self.addCleanup(cache.clear)

    def post(self, body=None):
        return self.client.post(self.url, {} if body is None else body, format='json')

    # Checks ownership, positive quantity, use-by ordering (including estimates) and uncached recipe results.
    def test_only_own_active_unexpired_items_in_urgency_order(self):
        GroceryItem.objects.create(user=self.other, name='private', category='Grain')
        GroceryItem.objects.create(user=self.user, name='empty', category='Grain', quantity=0)
        GroceryItem.objects.create(user=self.user, name='old', category='Grain',
                                   expiration_date=date.today() - timedelta(days=1))
        FoodType.objects.create(name='Eggs', category='Eggs', fridge_days=1)
        GroceryItem.objects.create(user=self.user, name='Eggs', category='Eggs',
                                   purchase_date=date.today())
        response = self.post()
        self.assertEqual(response.status_code, 200)
        self.generate.assert_called_once_with(['Eggs', 'rice'])
        self.assertEqual(json.loads(response.content), {'recipes': self.result})
        self.assertIn('no-store', response['Cache-Control'])

    # Checks that signed-out requests return 401 without calling the AI.
    def test_authentication_required(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.post().status_code, 401)
        self.generate.assert_not_called()

    # Checks that GET returns 405 without triggering recipe generation.
    def test_get_is_not_generation(self):
        self.assertEqual(self.client.get(self.url).status_code, 405)
        self.generate.assert_not_called()

    # Checks that client-supplied groceries and owner IDs return 400 without calling the AI.
    def test_rejects_supplied_inventory_and_owner(self):
        self.assertEqual(self.post({'user': self.other.pk, 'food_items': ['private']}).status_code, 400)
        self.generate.assert_not_called()

    # Checks that expired-only or empty inventory returns 400 without calling the AI.
    def test_empty_or_expired_inventory_does_not_call_ai(self):
        self.item.expiration_date = date.today() - timedelta(days=1)
        self.item.save()
        self.assertEqual(self.post().status_code, 400)
        self.item.delete()
        self.assertEqual(self.post().status_code, 400)
        self.generate.assert_not_called()

    # Checks that more than 100 active groceries returns 400 without calling the AI.
    def test_inventory_limit(self):
        GroceryItem.objects.bulk_create([
            GroceryItem(user=self.user, name=f'food {i}', category='Grain') for i in range(100)
        ])
        self.assertEqual(self.post().status_code, 400)
        self.generate.assert_not_called()

    # Checks that invalid structure, missing fields, long cooking times, or unlisted groceries return 502.
    def test_bad_ai_output_is_502(self):
        for result in ({'recipes': self.result}, [], [{'name': 'Missing fields'}],
                       [{**self.result[0], 'time_minutes': 100}],
                       [{**self.result[0], 'uses': ['another users food']}]):
            cache.clear()
            with self.subTest(result=result):
                self.generate.return_value = result
                self.assertEqual(self.post().status_code, 502)

    # Checks that an AI availability failure is returned as HTTP 503.
    def test_provider_failure_is_503(self):
        self.generate.side_effect = AIUnavailable()
        self.assertEqual(self.post().status_code, 503)

    # Checks the real service path returns 503 with a configuration message when the API key is missing.
    @override_settings(GEMINI_API_KEY='')
    def test_missing_credentials_is_503(self):
        patch.stopall()
        response = self.post()
        self.assertEqual(response.status_code, 503)
        self.assertIn('credentials', json.loads(response.content)['detail'])

    # Checks that five recipe requests exhaust the shared limit for both recipe and shopping generation.
    def test_throttle_shared_between_generation_routes(self):
        for _ in range(5):
            self.assertEqual(self.post().status_code, 200)
        self.assertEqual(self.post().status_code, 429)
        response = self.client.post('/api/shopping/generate/', {}, format='json')
        self.assertEqual(response.status_code, 429)
