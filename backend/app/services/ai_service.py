import os
import requests


class AIService:

    @staticmethod
    def generate_answer(question, context, business_name="the business"):

        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise ValueError(
                "OpenAI API key is not configured."
            )

        model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

        instructions = f"""
        You are the official AI assistant for {business_name}.

        Answer customer questions using the provided business
        information.

        Rules:
        1. Give clear and helpful answers.
        2. Use the provided information as your main source.
        3. Never invent prices, services, timings or policies.
        4. If the information is unavailable, say so honestly.
        5. Be polite and professional.

        BUSINESS KNOWLEDGE:
        {context}
        """

        try:
            response = requests.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "instructions": instructions,
                    "input": question
                },
                timeout=60
            )

            response.raise_for_status()
            data = response.json()

            for item in data.get("output", []):
                if item.get("type") == "message":
                    for content in item.get("content", []):
                        if content.get("type") == "output_text":
                            return content.get("text", "")

            raise ValueError("No answer was generated.")

        except requests.RequestException as error:
            raise RuntimeError(
                f"AI service error: {error}"
            )