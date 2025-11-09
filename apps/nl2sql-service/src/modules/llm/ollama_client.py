from langchain_ollama import ChatOllama


class OllamaLLM:
    def __init__(self, model_name: str = "llama3.2"):
        self.client = ChatOllama(
            model=model_name,
            temperature=0.2,
            num_ctx=4096,
            num_thread=8,
            top_k=40,
            top_p=0.95,
        )

    def model(self):
        return self.client
