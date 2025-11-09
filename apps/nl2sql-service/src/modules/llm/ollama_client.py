from langchain_ollama import ChatOllama


class OllamaLLM:
    def __init__(self, model_name: str = "llama3.2"):
        # Initialize Ollama LLM client
        # Args:
        #   model_name: Name of the Ollama model to use
        
        self.client = ChatOllama(
            model=model_name,
            temperature=0.2,
            num_ctx=4096,
            num_thread=8,
            top_k=40,
            top_p=0.95,
        )

    def model(self):
        # Return the LLM client instance
        return self.client
