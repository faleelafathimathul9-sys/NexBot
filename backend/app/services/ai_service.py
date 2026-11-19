import os
import requests


class AIService:

    @staticmethod
    def generate_answer(
        question,
        context,
        business_name="the business",
        language="en",
        conversation_history=None
    ):

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "Gemini API key is not configured. "
                "Check your backend .env file."
            )

        model = os.getenv(
            "GEMINI_MODEL",
            "gemini-3.5-flash-lite"
        )

        url = (
            f"https://generativelanguage.googleapis.com/"
            f"v1beta/models/{model}:generateContent"
        )

        if language == "kn":
            language_instruction = """
Respond in Kannada.

Use natural, simple Kannada that customers can easily understand.
Continue responding in Kannada unless the customer switches to English.
"""
        else:
            language_instruction = """
Respond in English.

Use simple, clear and friendly English.
Continue responding in English unless the customer switches to Kannada.
"""

        instructions = f"""
You are the official AI assistant for {business_name}.

Your job is to help customers with their questions.

LANGUAGE RULES:

1. {language_instruction}
2. Always pay attention to the language of the customer's latest message.
3. If the customer switches from English to Kannada, immediately respond in Kannada.
4. If the customer switches from Kannada to English, immediately respond in English.
5. Do not restart the conversation when the language changes.
6. Remember the previous conversation and maintain its context.
7. If the customer uses Kannada script, respond in Kannada.
8. If the customer uses English, respond in English.

CUSTOMER SUPPORT RULES:

1. Give clear, friendly and professional answers.
2. Use the provided business information.
3. Never invent prices, products, services or policies.
4. If information is unavailable, say so honestly.
5. Keep answers easy to understand.
6. Do not ask customers to repeat information they have already provided.

BUSINESS KNOWLEDGE:

{context}
"""

        # Build conversation history for Gemini.
        contents = []

        if conversation_history:
            for message in conversation_history:

                role = message.get("role")
                content = message.get("content", "")

                if not content:
                    continue

                gemini_role = (
                    "model" if role == "assistant" else "user"
                )

                contents.append({
                    "role": gemini_role,
                    "parts": [{"text": content}]
                })

        # Add the latest customer message.
        contents.append({
            "role": "user",
            "parts": [{"text": question}]
        })

        try:

            response = requests.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key
                },
                json={
                    "systemInstruction": {
                        "parts": [
                            {"text": instructions}
                        ]
                    },
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 800
                    }
                },
                timeout=60
            )

            response.raise_for_status()

            data = response.json()

            candidates = data.get("candidates", [])

            if not candidates:
                raise ValueError(
                    "Gemini did not generate a response."
                )

            parts = candidates[0].get(
                "content", {}
            ).get("parts", [])

            answer = "".join(
                part.get("text", "")
                for part in parts
                if part.get("text")
            )

            if not answer:
                raise ValueError(
                    "Gemini returned an empty response."
                )

            return answer

        except requests.exceptions.HTTPError as error:

            details = error.response.text[:1000]

            raise RuntimeError(
                f"Gemini API error: {details}"
            )

        except requests.exceptions.RequestException as error:

            raise RuntimeError(
                f"Could not connect to Gemini: {error}"
            )