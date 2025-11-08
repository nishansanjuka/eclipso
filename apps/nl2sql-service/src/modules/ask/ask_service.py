from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import re

# from ..llm.ollama_client import OllamaLLM
from src.shared.utils.get_db_info import get_database_schema
from .constants.system_prompt import SYSTEM_PROMPT
from ..llm.gemini_client import GeminiLLM
from ..query.query_service import QueryService
from .reasoning_service import ReasoningService
from sqlalchemy.exc import SQLAlchemyError


class AskService:
    def __init__(self, database_url: str, model_name: str):
        """
        Initialize the Ask service with LLM model and database connection.

        Args:
            database_url: SQLAlchemy database connection string
            model_name: Name of the Ollama model to use (default: llama3.2)
        """
        self.llm = GeminiLLM(model_name=model_name)
        self.database_url = database_url
        self.output_parser = StrOutputParser()
        self.query_service = QueryService(database_url=database_url)
        self.reasoning_service = ReasoningService(model_name=model_name)

    @staticmethod
    def clean_sql_query(sql_query: str) -> str:
        """
        Remove markdown formatting and extra whitespace from SQL query.

        Args:
            sql_query: Raw SQL query string from LLM

        Returns:
            Cleaned SQL query
        """
        # Remove markdown code blocks (```sql ... ``` or ``` ... ```)
        sql_query = re.sub(r"```sql\s*", "", sql_query)
        sql_query = re.sub(r"```\s*", "", sql_query)
        
        # Remove leading/trailing whitespace
        sql_query = sql_query.strip()
        
        return sql_query

    def get_schema_context(self) -> str:
        """
        Retrieve database schema as formatted context string.

        Returns:
            Formatted string containing database schema information
        """
        schema_info = get_database_schema(self.database_url)
        context = []

        for table_name, table_info in schema_info.items():
            columns = ", ".join(
                [f"{col['name']} ({col['type']})" for col in table_info["columns"]]
            )
            context.append(f"Table: {table_name}\nColumns: {columns}")

            if table_info["foreign_keys"]:
                fks = ", ".join(
                    [
                        f"{fk['column']} -> {fk['references']}"
                        for fk in table_info["foreign_keys"]
                    ]
                )
                context.append(f"Foreign Keys: {fks}")

        return "\n\n".join(context)

    def ask(self, question: str) -> dict:
        """
        Process natural language question and generate SQL query or answer.

        Args:
            question: Natural language question about the database

        Returns:
            Dictionary containing SQL query, results, and human-readable answer
        """
        schema_context = self.get_schema_context()

        # Step 1: Generate SQL query from natural language
        prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("user", "{question}"),
            ]
        )

        chain = prompt_template | self.llm.model() | self.output_parser

        sql_query = chain.invoke({"context": schema_context, "question": question})
        
        # Clean the SQL query (remove markdown formatting)
        sql_query = self.clean_sql_query(sql_query)
        
        print(f"Generated SQL Query: {sql_query}")

        # Check if LLM couldn't help
        if "I can't help you with that" in sql_query:
            return {
                "sql_query": None,
                "results": None,
                "answer": sql_query,
                "success": True,
            }

        try:
            # Step 2: Execute the SQL query
            db_results = self.query_service.query(sql_query)

            # Step 3: Generate human-readable response
            human_answer = self.reasoning_service.generate_human_response(
                question=question, sql_query=sql_query, db_results=db_results
            )

            return {
                "sql_query": sql_query,
                "results": db_results,
                "answer": human_answer,
                "success": True,
            }

        except SQLAlchemyError as e:
            return {
                "sql_query": sql_query,
                "results": None,
                "answer": f"Error executing query: {str(e)}",
                "success": False,
            }
