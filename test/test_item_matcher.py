import sys
import unittest
from pathlib import Path
from unittest.mock import patch

# Import the same service packages available when Django runs from backend/
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from grocery_buddy.ai import AIUnavailable
from inventory.services.ai_matcher import FOOD_TYPES, match_with_ai
from inventory.services.signature_matcher import match_food


class TestSignatureMatcher(unittest.TestCase):

    def setUp(self):
        # Replace the AI with a fake so no test ever calls Gemini
        self.ai = patch("inventory.services.signature_matcher.match_with_ai", return_value="Protein").start()
        self.addCleanup(patch.stopall)

    def test_single_word(self):
        self.assertEqual(match_food("banana"), "Fruit")

    def test_phrase_beats_single_word(self):
        self.assertEqual(match_food("peanut butter"), "Pantry")
        self.assertEqual(match_food("almond milk"), "Beverage")
        self.assertEqual(match_food("black pepper"), "Pantry")

    def test_last_word_decides(self):
        self.assertEqual(match_food("chicken broth"), "Pantry")
        self.assertEqual(match_food("strawberry yogurt"), "Dairy")
        self.assertEqual(match_food("egg noodles"), "Grain")

    def test_any_word_matches(self):
        self.assertEqual(match_food("chicken thighs"), "Meat")

    def test_plural(self):
        self.assertEqual(match_food("carrots"), "Vegetable")
        self.assertEqual(match_food("eggs"), "Eggs")

    def test_stop_words_ignored(self):
        self.assertEqual(match_food("Organic Boneless Skinless Chicken Breast 2 lb"), "Meat")

    def test_case_and_punctuation(self):
        self.assertEqual(match_food("Baby Spinach (5oz)"), "Vegetable")

    def test_known_food_skips_ai(self):
        match_food("banana")
        self.ai.assert_not_called()

    def test_unknown_food_uses_ai(self):
        self.assertEqual(match_food("quorn nuggets"), "Protein")
        self.ai.assert_called_once_with("quorn nuggets")

    def test_no_ai_answer_uses_pantry(self):
        self.ai.return_value = None
        self.assertEqual(match_food("quorn nuggets"), "Pantry")

    def test_ai_failure_uses_pantry(self):
        self.ai.side_effect = AIUnavailable()
        self.assertEqual(match_food("quorn nuggets"), "Pantry")

    def test_only_stop_words_uses_ai(self):
        match_food("fresh organic")
        self.ai.assert_called_once_with("fresh organic")

    def test_empty_name_uses_ai(self):
        match_food("")
        self.ai.assert_called_once_with("")


class TestAIMatcher(unittest.TestCase):

    def setUp(self):
        # Replace the shared Gemini helper with a fake that always answers "Vegetable"
        self.generate = patch("inventory.services.ai_matcher.generate_json",
                              return_value={"category": "Vegetable"}).start()
        self.addCleanup(patch.stopall)

    def test_returns_ai_category(self):
        self.assertEqual(match_with_ai("baby spinach"), "Vegetable")

    def test_calls_ai_once(self):
        match_with_ai("baby spinach")
        self.generate.assert_called_once()

    def test_prompt_includes_food_and_types(self):
        match_with_ai("baby spinach")
        prompt = self.generate.call_args.args[0]
        self.assertIn("baby spinach", prompt)
        for food_type in FOOD_TYPES:
            self.assertIn(food_type, prompt)

    def test_invalid_answer_returns_none(self):
        for result in ({"category": "Candy"}, {"category": None}, {}, ["Vegetable"]):
            with self.subTest(result=result):
                self.generate.return_value = result
                self.assertIsNone(match_with_ai("baby spinach"))


if __name__ == "__main__":
    unittest.main()
