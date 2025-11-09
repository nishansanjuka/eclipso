from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
import os


class VectorStoreService:
    def __init__(self, api_key: str, index_name: str):

        # Initialize the Vector Store service for similarity search.

        # Args:
        #    api_key: Pinecone API key
        #    index_name: Name of the Pinecone index to use
        #
        # Initialize embeddings
        self.embedding = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

        # Initialize Pinecone
        self.pc = Pinecone(api_key=api_key)
        self.index = self.pc.Index(index_name)

        # Create vector store
        self.vector_store = PineconeVectorStore(
            embedding=self.embedding, index=self.index
        )

    def search_similar_schemas(self, question: str, k: int = 5) -> str:

        # Search for similar schema chunks based on the question.

        # Args:
        #   question: Natural language question
        #    k: Number of similar documents to retrieve

        # Returns:
        #    Formatted string containing relevant schema context

        # Perform similarity search
        docs = self.vector_store.similarity_search(question, k=k)

        # Format the results
        context_parts = []
        for doc in docs:
            context_parts.append(doc.page_content)

        return "\n\n".join(context_parts)
