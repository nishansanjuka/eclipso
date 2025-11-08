from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..modules.ask.ask_service import AskService
from src.shared.middleware.auth import get_current_user
from typing import List, Dict, Any
import os

load_dotenv()
router = APIRouter(prefix="/ask", tags=["ask"])

# Initialize the service (you can move this to a dependency injection pattern later)
DATABASE_URL = os.getenv("DATABASE_URL", "")
MODEL_NAME = os.getenv("LLM_MODEL_NAME", "")

ask_service = AskService(database_url=DATABASE_URL, model_name=MODEL_NAME)


class AskRequest(BaseModel):
    question: str

    class Config:
        json_schema_extra = {
            "example": {
                "question": "Show me all customers who made purchases last month"
            }
        }


class AskResponse(BaseModel):
    question: str
    sql_query: str | None = None
    results: List[Dict[str, Any]] | None = None
    answer: str
    success: bool
    error: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the top 5 selling products?",
                "sql_query": "SELECT product_name, SUM(quantity) as total_sold FROM sales GROUP BY product_name ORDER BY total_sold DESC LIMIT 5;",
                "results": [
                    {"product_name": "Product A", "total_sold": 150},
                    {"product_name": "Product B", "total_sold": 120},
                ],
                "answer": "The top 5 selling products are: Product A with 150 units sold, Product B with 120 units sold...",
                "success": True,
                "error": None,
            }
        }


@router.post("/", response_model=AskResponse)
async def ask_question(request: AskRequest, user: dict = Depends(get_current_user)):
    """
    Convert natural language question to SQL query, execute it, and return human-readable answer.

    Requires authentication via Clerk token.

    Args:
        request: AskRequest containing the natural language question
        user: Authenticated user information from Clerk token

    Returns:
        AskResponse with SQL query, results, and human-readable answer
    """
    try:

        result = ask_service.ask(request.question)

        return AskResponse(
            question=request.question,
            sql_query=result.get("sql_query"),
            results=result.get("results"),
            answer=result.get("answer", ""),
            success=result.get("success", True),
            error=None,
        )
    except Exception as e:
        return AskResponse(
            question=request.question,
            sql_query=None,
            results=None,
            answer="",
            success=False,
            error=str(e),
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the ask service.
    """
    return {"status": "healthy", "service": "ask", "model": MODEL_NAME}
