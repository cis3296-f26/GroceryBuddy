from django.contrib.auth import get_user_model  # Django's built-in user
from django.core.exceptions import ValidationError  # error for bad data
from django.core.management import call_command  # lets a test run manage.py commands
from django.db import IntegrityError  # error the database gives for duplicates
from django.test import TestCase  # each test gets its own empty test database

from .models import FoodType, GroceryItem  # the tables we are testing


class GroceryItemModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="sam", password="test")  # a fake student

    def test_item_is_saved_and_loaded(self):
        item = GroceryItem.objects.create(user=self.user, name="Milk", category="Dairy")  # save an item
        loaded = GroceryItem.objects.get(pk=item.pk)  # read it back from the database
        self.assertEqual(loaded.name, "Milk")
        self.assertEqual(loaded.user, self.user)

    def test_defaults(self):
        item = GroceryItem.objects.create(user=self.user, name="Milk", category="Dairy")  # only fill in the basics
        self.assertEqual(item.quantity, 1)  # 1 if not given
        self.assertEqual(item.storage_location, "fridge")  # fridge if not given
        self.assertEqual(item.status, "available")  # new food is available
        self.assertEqual(item.unit, "")  # unit can be empty
        self.assertIsNone(item.expiration_date)  # package date is optional

    def test_unit_and_status_are_saved(self):
        item = GroceryItem.objects.create(user=self.user, name="Eggs", category="Eggs", unit="carton", status="used")
        item.refresh_from_db()  # load again from the database
        self.assertEqual(item.unit, "carton")
        self.assertEqual(item.status, "used")

    def test_bad_status_is_rejected(self):
        item = GroceryItem(user=self.user, name="Eggs", category="Eggs", status="eaten")  # "eaten" is not a choice
        with self.assertRaises(ValidationError):  # Django should say no
            item.full_clean()  # full_clean checks every field

    def test_negative_quantity_is_rejected(self):
        item = GroceryItem(user=self.user, name="Eggs", category="Eggs", quantity=-1)  # can't have -1 eggs
        with self.assertRaises(ValidationError):
            item.full_clean()

    def test_deleting_user_deletes_their_groceries(self):
        GroceryItem.objects.create(user=self.user, name="Milk", category="Dairy")
        self.user.delete()  # remove the student
        self.assertEqual(GroceryItem.objects.count(), 0)  # their groceries are gone too


class FoodTypeModelTests(TestCase):
    def test_food_names_must_be_unique(self):
        FoodType.objects.create(name="Eggs", category="Eggs", fridge_days=21)
        with self.assertRaises(IntegrityError):  # the database blocks a second "Eggs"
            FoodType.objects.create(name="Eggs", category="Eggs", fridge_days=21)

    def test_seed_foods_loads_every_food_once(self):
        call_command("seed_foods", stdout=None)  # run the command
        call_command("seed_foods", stdout=None)  # run it again
        self.assertEqual(FoodType.objects.count(), 42)  # still 42, no duplicates

    def test_seed_foods_numbers(self):
        call_command("seed_foods", stdout=None)
        eggs = FoodType.objects.get(name="Eggs")  # spot check one food
        self.assertEqual(eggs.fridge_days, 21)
        self.assertIsNone(eggs.freezer_days)  # USDA has no freezer number for eggs in the shell
        milk = FoodType.objects.get(name="Milk")
        self.assertIsNone(milk.fridge_days)  # USDA says use the package date