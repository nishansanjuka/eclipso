from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
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
PINCONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "")

ask_service = AskService(
    database_url=DATABASE_URL,
    model_name=MODEL_NAME,
    pinecone_api_key=PINCONE_API_KEY,
    index_name=INDEX_NAME,
)


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

    SECURITY: Automatically filters all queries to return ONLY data belonging to the
    authenticated user's organization. Users cannot access data from other organizations.

    Args:
        request: AskRequest containing the natural language question
        user: Authenticated user information from Clerk token (contains user_id and org_id)

    Returns:
        AskResponse with SQL query, results, and human-readable answer
    """
    try:
        # Pass user context for automatic security filtering
        result = ask_service.ask(
            question=request.question,
            user_context={
                "user_id": user.get(
                    "user_id"
                ),  # Clerk user ID (matches users.clerk_id)
                "org_id": user.get(
                    "org_id"
                ),  # Clerk org ID (matches businesses.org_id)
            },
        )

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


@router.post("/stream")
async def ask_question_stream(
    request: AskRequest, user: dict = Depends(get_current_user)
):
    """
    Convert natural language question to SQL query with streaming status updates.

    This endpoint returns Server-Sent Events (SSE) with real-time progress:
    1. retrieving_context - Finding relevant database tables
    2. generating_query - Converting question to SQL
    3. executing_query - Fetching data from database
    4. generating_answer - Analyzing and formatting results
    5. completed - Final result with answer and data
    6. error - If any error occurs

    Requires authentication via Clerk token.

    SECURITY: Automatically filters all queries to return ONLY data belonging to the
    authenticated user's organization.

    Args:
        request: AskRequest containing the natural language question
        user: Authenticated user information from Clerk token

    Returns:
        StreamingResponse with SSE events
    """

    def generate():
        # Generator function for SSE
        try:
            for event in ask_service.ask_stream(
                question=request.question,
                user_context={
                    "user_id": user.get("user_id"),
                    "org_id": user.get("org_id"),
                },
            ):
                yield event
        except Exception as e:
            # Fallback error event
            yield f"data: {{'status': 'error', 'data': {{'error': '{str(e)}'}}}}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
