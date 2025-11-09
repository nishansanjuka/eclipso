from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from sqlalchemy.exc import SQLAlchemyError
from typing import Generator

from .constants.system_prompt import SYSTEM_PROMPT
from ..llm.gemini_client import GeminiLLM
from ..llm.ollama_client import OllamaLLM
from ..query.query_service import QueryService
from .reasoning_service import ReasoningService
from ..vector_store.vector_store_service import VectorStoreService
from src.shared.utils.sql_utils import clean_sql_query, is_valid_sql
from src.shared.utils.stream_utils import create_stream_event


class AskService:
    def __init__(
        self,
        database_url: str,
        model_name: str,
        pinecone_api_key: str,
        index_name: str,
    ):
        # Initialize the Ask service with LLM model and database connection.
        # Args:
        #   database_url: SQLAlchemy database connection string
        #   model_name: Name of the Gemini model to use
        #   pinecone_api_key: Pinecone API key for vector store
        #   index_name: Name of the Pinecone index to use

        self.llm = (
            OllamaLLM(model_name=model_name)
            if "llama" in model_name
            else GeminiLLM(model_name=model_name)
        )
        self.database_url = database_url
        self.output_parser = StrOutputParser()
        self.query_service = QueryService(database_url=database_url)
        self.reasoning_service = ReasoningService(model_name=model_name)
        self.vector_store_service = VectorStoreService(
            api_key=pinecone_api_key, index_name=index_name
        )

    def ask(self, question: str, user_context: dict | None = None) -> dict:
        # Process natural language question and generate SQL query or answer.
        # Automatically filters data by authenticated user's business context.
        # Args:
        #   question: Natural language question about the database
        #   user_context: Authenticated user information containing user_id (clerk_id) and org_id
        # Returns:
        #   Dictionary containing SQL query, results, and human-readable answer

        # Get relevant schema context using similarity search
        schema_context = self.vector_store_service.search_similar_schemas(question, k=5)

        # Extract security context
        clerk_id = user_context.get("user_id") if user_context else None
        org_id = user_context.get("org_id") if user_context else None

        # Step 1: Generate SQL query from natural language with security context
        prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("user", "{question}"),
            ]
        )

        chain = prompt_template | self.llm.model() | self.output_parser

        sql_query = chain.invoke(
            {
                "context": schema_context,
                "question": question,
                "clerk_id": clerk_id,
                "org_id": org_id,
            }
        )

        # Clean the SQL query (remove markdown formatting)
        sql_query = clean_sql_query(sql_query)

        print(f"Generated SQL Query: {sql_query}")

        # Validate if response is actual SQL
        if not is_valid_sql(sql_query):
            # LLM returned a message instead of SQL
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
                "sql_query": "`SQL Query Removed for Security`",
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

    def ask_stream(
        self, question: str, user_context: dict | None = None
    ) -> Generator[str, None, None]:
        # Process natural language question with streaming status updates.
        # Args:
        #   question: Natural language question about the database
        #   user_context: Authenticated user information containing user_id (clerk_id) and org_id
        # Yields:
        #   SSE formatted status updates

        try:
            # Step 1: Retrieve schema context
            yield create_stream_event(
                "retrieving_context", {"message": "Finding relevant database tables..."}
            )

            schema_context = self.vector_store_service.search_similar_schemas(
                question, k=5
            )

            # Extract security context
            clerk_id = user_context.get("user_id") if user_context else None
            org_id = user_context.get("org_id") if user_context else None

            # Step 2: Generate SQL query
            yield create_stream_event(
                "generating_query", {"message": "Converting your question to SQL..."}
            )

            prompt_template = ChatPromptTemplate.from_messages(
                [
                    ("system", SYSTEM_PROMPT),
                    ("user", "{question}"),
                ]
            )

            chain = prompt_template | self.llm.model() | self.output_parser

            sql_query = chain.invoke(
                {
                    "context": schema_context,
                    "question": question,
                    "clerk_id": clerk_id,
                    "org_id": org_id,
                }
            )

            # Clean the SQL query
            sql_query = clean_sql_query(sql_query)

            # Validate if response is actual SQL
            if not is_valid_sql(sql_query):
                # LLM returned a message instead of SQL
                yield create_stream_event(
                    "completed",
                    {
                        "question": question,
                        "sql_query": None,
                        "results": None,
                        "answer": sql_query,
                        "success": True,
                    },
                )
                return

            # Step 3: Execute query
            yield create_stream_event(
                "executing_query", {"message": "Fetching your data..."}
            )

            db_results = self.query_service.query(sql_query)

            # Step 4: Initialize the response object and stream answer progressively
            yield create_stream_event(
                "generating_answer",
                {
                    "question": question,
                    "sql_query": "`SQL Query Removed for Security`",
                    "results": db_results,
                    "answer": "",
                    "success": True,
                },
            )

            # Stream the answer token-by-token, updating the same object structure
            answer_chunks = []
            for chunk in self.reasoning_service.generate_human_response_stream(
                question=question, sql_query=sql_query, db_results=db_results
            ):
                answer_chunks.append(chunk)
                current_answer = "".join(answer_chunks)

                # Send progressive updates with the full object structure
                yield create_stream_event(
                    "generating_answer",
                    {
                        "question": question,
                        "sql_query": "`SQL Query Removed for Security`",
                        "results": db_results,
                        "answer": current_answer,
                        "success": True,
                    },
                )

            # Combine all chunks for final result
            human_answer = "".join(answer_chunks).strip()

            # Step 5: Send final completed event with same structure
            yield create_stream_event(
                "completed",
                {
                    "question": question,
                    "sql_query": "`SQL Query Removed for Security`",
                    "results": db_results,
                    "answer": human_answer,
                    "success": True,
                },
            )

        except SQLAlchemyError as e:
            yield create_stream_event(
                "error",
                {
                    "question": question,
                    "sql_query": None,
                    "results": None,
                    "answer": f"Error executing query: {str(e)}",
                    "success": False,
                    "error": str(e),
                },
            )
        except Exception as e:
            yield create_stream_event(
                "error",
                {
                    "question": question,
                    "sql_query": None,
                    "results": None,
                    "answer": f"An error occurred: {str(e)}",
                    "success": False,
                    "error": str(e),
                },
            )
