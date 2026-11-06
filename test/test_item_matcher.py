import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Let the tests import from src/food_matcher
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "food_matcher"))

# Use a fake google module if google-genai isn't installed, so the tests still run
try:
    import google.genai
except ImportError:
    google = MagicMock()
    sys.modules["google"] = google
    sys.modules["google.genai"] = google.genai

from ai_matcher import FOOD_TYPES, MODEL, match_with_ai
from signature_matcher import match_food


class TestSignatureMatcher(unittest.TestCase):

    def setUp(self):
        # Replace the AI with a fake so no test ever calls Gemini
        self.ai = patch("signature_matcher.match_with_ai", return_value="Protein").start()
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

    def test_ai_answer_is_stripped(self):
        self.ai.return_value = " Protein\n"
        self.assertEqual(match_food("quorn nuggets"), "Protein")

    def test_only_stop_words_uses_ai(self):
        match_food("fresh organic")
        self.ai.assert_called_once_with("fresh organic")

    def test_empty_name_uses_ai(self):
        match_food("")
        self.ai.assert_called_once_with("")


class TestAIMatcher(unittest.TestCase):

    def setUp(self):
        # Replace the Gemini client with a fake that always answers "Vegetable"
        client_class = patch("ai_matcher.genai.Client").start()
        self.addCleanup(patch.stopall)
        self.generate = client_class.return_value.models.generate_content
        self.generate.return_value.text = "Vegetable"

    def test_returns_ai_answer(self):
        self.assertEqual(match_with_ai("baby spinach"), "Vegetable")

    def test_calls_ai_once(self):
        match_with_ai("baby spinach")
        self.generate.assert_called_once()

    def test_uses_model(self):
        match_with_ai("baby spinach")
        self.assertEqual(self.generate.call_args.kwargs["model"], MODEL)

    def test_sends_prompt_as_contents(self):
        match_with_ai("baby spinach")
        prompt = self.generate.call_args.kwargs.get("contents")
        self.assertIsNotNone(prompt, "generate_content needs the prompt passed as contents=")
        self.assertIn("baby spinach", prompt)
        for food_type in FOOD_TYPES:
            self.assertIn(food_type, prompt)


if __name__ == "__main__":
    unittest.main()
