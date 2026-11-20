import json

from django.conf import settings
from rest_framework.exceptions import APIException


class AIUnavailable(APIException):
    status_code = 503
    default_detail = "AI generation is unavailable. Please try again later."


class InvalidAIResponse(APIException):
    status_code = 502
    default_detail = "The AI returned an invalid response. Please try again."


def generate_json(prompt, *, temperature, max_output_tokens):
    if not settings.GEMINI_API_KEY:
        raise AIUnavailable("AI credentials are not configured on the backend.")
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise AIUnavailable("The backend AI dependency is not installed.") from exc

    # Stay below Gunicorn's default 30-second worker timeout; avoid automatic retries.
    try:
        with genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(
                timeout=20000, retry_options=types.HttpRetryOptions(attempts=1),
            ),
        ) as client:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                    response_mime_type="application/json",
                ),
            )
    except Exception as exc:
        # Provider exceptions can contain request data or credentials so we won't expose them.
        raise AIUnavailable() from exc
    text = response.text
    if text is None:
        raise InvalidAIResponse()
    try:
        return json.loads(text)
    except (ValueError, TypeError) as exc:
        raise InvalidAIResponse() from exc
