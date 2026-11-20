import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from .ai import AIUnavailable, InvalidAIResponse, generate_json


@override_settings(GEMINI_API_KEY='test-key', GEMINI_MODEL='test-model')
class GeminiBoundaryTests(SimpleTestCase):
    def setUp(self):
        self.sdk = ModuleType('google.genai')
        self.sdk.Client = MagicMock()
        self.sdk.types = SimpleNamespace(
            HttpOptions=lambda **kwargs: kwargs,
            HttpRetryOptions=lambda **kwargs: kwargs,
            GenerateContentConfig=lambda **kwargs: kwargs,
        )
        google = ModuleType('google')
        google.genai = self.sdk
        patcher = patch.dict(sys.modules, {'google': google, 'google.genai': self.sdk})
        patcher.start()
        self.addCleanup(patcher.stop)
        self.client = self.sdk.Client.return_value.__enter__.return_value

    def generate(self):
        return generate_json('test prompt', temperature=0.5, max_output_tokens=100)

    # Checks the configured key/model, 20-second timeout, single attempt, and client cleanup.
    def test_configured_model_key_timeout_and_client_cleanup(self):
        self.client.models.generate_content.return_value.text = '[]'
        self.assertEqual(self.generate(), [])
        self.assertEqual(self.sdk.Client.call_args.kwargs['api_key'], 'test-key')
        options = self.sdk.Client.call_args.kwargs['http_options']
        self.assertEqual(options['timeout'], 20000)
        self.assertEqual(options['retry_options']['attempts'], 1)
        self.assertEqual(self.client.models.generate_content.call_args.kwargs['model'], 'test-model')
        self.sdk.Client.return_value.__exit__.assert_called_once()

    # Checks that a missing API key raises an availability error without creating a Gemini client.
    @override_settings(GEMINI_API_KEY='')
    def test_missing_key_never_creates_client(self):
        with self.assertRaises(AIUnavailable):
            self.generate()
        self.sdk.Client.assert_not_called()

    # Checks that a provider timeout produces a generic error without exposing request secrets.
    def test_provider_errors_do_not_expose_secrets(self):
        self.client.models.generate_content.side_effect = TimeoutError('secret request contents')
        with self.assertRaises(AIUnavailable) as context:
            self.generate()
        self.assertNotIn('secret', str(context.exception))

    # Checks that malformed JSON, missing text, and empty text raise an invalid-response error.
    def test_invalid_json_and_empty_response(self):
        for text in ('not JSON', None, ''):
            with self.subTest(text=text):
                self.client.models.generate_content.return_value.text = text
                with self.assertRaises(InvalidAIResponse):
                    self.generate()
