from langchain_google_genai import ChatGoogleGenerativeAI
import os


class GeminiLLM:
    def __init__(self, model_name: str = "gemini-2.0-flash-lite"):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY environment variable is not set. "
                "Please add it to your .env file."
            )
        
        self.client = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )

    def model(self):
        return self.client
