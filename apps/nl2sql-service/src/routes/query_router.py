from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from ..modules.query.query_service import QueryService
import os
from typing import List, Dict, Any

router = APIRouter(prefix="/query", tags=["query"])

# Initialize the service
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:nishan@localhost:5432/eclipso_db"
)

query_service = QueryService(database_url=DATABASE_URL)


class QueryRequest(BaseModel):
    query: str = Field(..., description="PostgreSQL query to execute")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "SELECT id, name, email FROM customers LIMIT 10"
            }
        }


class QueryResponse(BaseModel):
    success: bool
    data: List[Dict[str, Any]] | None = None
    row_count: int = 0
    error: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": [
                    {"id": 1, "name": "John Doe", "email": "john@example.com"},
                    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
                ],
                "row_count": 2,
                "error": None
            }
        }


@router.post("/", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    """
    Execute a PostgreSQL query and return the results as JSON.

    Args:
        request: QueryRequest containing the SQL query string

    Returns:
        QueryResponse with query results or error message
    """
    try:
        # Execute the query
        results = query_service.query(request.query)
        
        return QueryResponse(
            success=True,
            data=results,
            row_count=len(results),
            error=None
        )
        
    except SQLAlchemyError as e:
        return QueryResponse(
            success=False,
            data=None,
            row_count=0,
            error=str(e)
        )
    except Exception as e:
        return QueryResponse(
            success=False,
            data=None,
            row_count=0,
            error=f"Unexpected error: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the query service.
    """
    try:
        # Test database connection with a simple query
        query_service.query("SELECT 1")
        return {
            "status": "healthy",
            "service": "query",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )
