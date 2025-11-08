from langchain_ollama import ChatOllama


class OllamaLLM:
    def __init__(self, model_name: str = "llama3.2"):
        self.client = ChatOllama(model=model_name)

    def model(self):
        return self.client
