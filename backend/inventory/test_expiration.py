from datetime import date  # for making test dates

from django.contrib.auth import get_user_model  # Django's built-in user
from django.core.management import call_command  # lets a test run manage.py commands
from django.test import TestCase  # each test gets its own empty test database

from .models import GroceryItem  # the grocery table
from .services.expiration import (  # the code we are testing
    dashboard_summary,
    find_food_type,
    get_label,
    get_status,
    sort_by_urgency,
)

TODAY = date(2026, 11, 20)  # a pretend "today" so the tests always give the same answer


class ExpirationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_foods", stdout=None)  # load the 42 foods into the test database
        cls.user = get_user_model().objects.create_user(username="sam", password="test")  # a fake student

    def make_item(self, name, storage="fridge", bought=TODAY, package_date=None):
        """Small helper so each test can make a grocery in one line."""
        return GroceryItem.objects.create(
            user=self.user, name=name, category="Pantry", storage_location=storage,
            purchase_date=bought, expiration_date=package_date,
        )

    # ---- labels ----

    def test_labels(self):
        self.assertEqual(get_label(-1), "pastEstimate")  # already passed
        self.assertEqual(get_label(0), "useToday")  # today
        self.assertEqual(get_label(1), "useSoon")  # 1 day left
        self.assertEqual(get_label(3), "useSoon")  # 3 days left
        self.assertEqual(get_label(4), "goodForNow")  # 4 days left
        self.assertEqual(get_label(None), "goodForNow")  # no date (same as the dashboard)

    # ---- use-by dates ----

    def test_package_date_wins(self):
        item = self.make_item("Chicken breast", package_date=date(2026, 11, 25))
        status = get_status(item, TODAY)
        self.assertEqual(status["use_by_date"], date(2026, 11, 25))  # the date the student typed
        self.assertFalse(status["is_estimate"])  # not a guess

    def test_estimate_from_fridge_days(self):
        item = self.make_item("Chicken breast")  # 1 day in the fridge
        status = get_status(item, TODAY)
        self.assertEqual(status["use_by_date"], date(2026, 11, 21))
        self.assertTrue(status["is_estimate"])
        self.assertEqual(status["label"], "useSoon")

    def test_changing_storage_changes_estimate(self):
        item = self.make_item("Ground beef", storage="freezer")  # 90 days in the freezer
        self.assertEqual(get_status(item, TODAY)["use_by_date"], date(2027, 2, 18))
        item.storage_location = "fridge"  # move it to the fridge (1 day)
        self.assertEqual(get_status(item, TODAY)["use_by_date"], date(2026, 11, 21))

    def test_milk_in_fridge_has_no_date(self):
        status = get_status(self.make_item("Milk"), TODAY)  # USDA has no fridge days for milk
        self.assertIsNone(status["use_by_date"])
        self.assertIsNone(status["days_left"])
        self.assertEqual(status["label"], "goodForNow")

    def test_unknown_food_has_no_date(self):
        status = get_status(self.make_item("Dragon fruit"), TODAY)  # not in our table
        self.assertIsNone(status["use_by_date"])

    # ---- month and year changes ----

    def test_end_of_month(self):
        item = self.make_item("Salmon", bought=date(2026, 1, 31))  # 1 day in the fridge
        self.assertEqual(get_status(item, TODAY)["use_by_date"], date(2026, 2, 1))  # Jan 31 + 1 = Feb 1

    def test_end_of_year(self):
        item = self.make_item("Chicken breast", bought=date(2026, 12, 31))  # 1 day in the fridge
        status = get_status(item, date(2027, 1, 1))  # pretend it's New Year's Day
        self.assertEqual(status["use_by_date"], date(2027, 1, 1))  # Dec 31 + 1 = Jan 1
        self.assertEqual(status["label"], "useToday")

    def test_leap_day(self):
        item = self.make_item("Salmon", bought=date(2028, 2, 28))  # 2028 is a leap year
        self.assertEqual(get_status(item, TODAY)["use_by_date"], date(2028, 2, 29))

    # ---- name matching ----

    def test_name_matching(self):
        self.assertEqual(find_food_type("potato").name, "Potatoes")  # add "es"
        self.assertEqual(find_food_type("apple").name, "Apples")  # add "s"
        self.assertEqual(find_food_type("strawberry").name, "Strawberries")  # y -> ies
        self.assertEqual(find_food_type("  MILK ").name, "Milk")  # spaces and capitals
        self.assertIsNone(find_food_type("dragon fruit"))  # not in our table

    # ---- the plan's test: 5 groceries ----

    def test_five_groceries_get_labels_and_order(self):
        self.make_item("Bread", package_date=date(2026, 11, 30))  # 10 days -> Good for Now
        self.make_item("Yogurt", package_date=date(2026, 11, 18))  # 2 days ago -> Past Estimate
        self.make_item("Eggs", package_date=date(2026, 11, 20))  # today -> Use Today
        self.make_item("Spinach", package_date=date(2026, 11, 22))  # 2 days -> Use Soon
        self.make_item("Butter", package_date=date(2026, 11, 24))  # 4 days -> Good for Now

        items = GroceryItem.objects.filter(user=self.user)  # read them back from the database
        ordered = sort_by_urgency(items, TODAY)

        names = [s["item"].name for s in ordered]
        labels = [s["label"] for s in ordered]
        self.assertEqual(names, ["Yogurt", "Eggs", "Spinach", "Butter", "Bread"])  # soonest first
        self.assertEqual(labels, ["pastEstimate", "useToday", "useSoon", "goodForNow", "goodForNow"])

    def test_items_with_no_date_go_last(self):
        self.make_item("Milk")  # no date
        self.make_item("Eggs", package_date=date(2026, 11, 21))
        ordered = sort_by_urgency(GroceryItem.objects.filter(user=self.user), TODAY)
        self.assertEqual([s["item"].name for s in ordered], ["Eggs", "Milk"])

    def test_dashboard_summary(self):
        self.make_item("Eggs", package_date=date(2026, 11, 20))  # Use Today
        self.make_item("Spinach", package_date=date(2026, 11, 22))  # Use Soon
        self.make_item("Milk")  # no date -> Good for Now
        summary = dashboard_summary(GroceryItem.objects.filter(user=self.user), TODAY)
        self.assertEqual(summary, {"useToday": 1, "useSoon": 1, "goodForNow": 1, "pastEstimate": 0, "total": 3})