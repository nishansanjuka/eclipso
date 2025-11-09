from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from ..llm.gemini_client import GeminiLLM
from ..llm.ollama_client import OllamaLLM
from .constants.reasoning_prompt import REASONING_PROMPT
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()


class ReasoningService:
    def __init__(self, model_name: str):
        """
        Initialize the Reasoning service with LLM model.

        Args:
            model_name: Name of the LLM model to use
        """
        self.llm = (
            OllamaLLM(model_name=model_name)
            if "llama" in model_name
            else GeminiLLM(model_name=model_name)
        )
        self.output_parser = StrOutputParser()

    def generate_human_response(
        self, question: str, sql_query: str, db_results: List[Dict[str, Any]]
    ) -> str:
        """
        Convert database query results into human-readable response.

        Args:
            question: Original user question
            sql_query: SQL query that was executed
            db_results: JSON results from database

        Returns:
            Human-readable answer based on the results
        """
        # Convert results to formatted JSON string
        results_json = json.dumps(db_results, indent=2, default=str)

        prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", REASONING_PROMPT),
                (
                    "user",
                    "Please provide a clear answer based on the above information.",
                ),
            ]
        )

        chain = prompt_template | self.llm.model() | self.output_parser

        response = chain.invoke(
            {"question": question, "sql_query": sql_query, "results": results_json}
        )

        return response
