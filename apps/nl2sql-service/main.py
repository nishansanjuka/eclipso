# Eclipso NL2SQL Service - Deployed with version 3 clean secrets
from fastapi import FastAPI
from src.routes.ask_router import router as ask_router
from scalar_fastapi import get_scalar_api_reference
from scalar_fastapi import Theme

app = FastAPI(
    title="Eclipso NL2SQL Service API",
    description=(
        "An intelligent Natural Language to SQL (NL2SQL) conversion service integrated with the Eclipso Point-of-Sale system. "
        "This API leverages advanced AI models (Gemini/Ollama) and vector search technology (Pinecone) to transform natural language "
        "questions into executable SQL queries, providing real-time business analytics and insights.\n\n"
        "**Key Features:**\n"
        "- 🤖 **AI-Powered Query Generation**: Convert plain English questions to optimized PostgreSQL queries\n"
        "- 🔍 **Semantic Schema Search**: Intelligent context retrieval using vector embeddings for relevant database schema matching\n"
        "- 🔒 **Multi-Tenant Security**: Automatic data isolation by organization (org_id) and user (clerk_id) with role-based access control\n"
        "- 📊 **Real-Time Analytics**: Instant insights into sales, inventory, customers, products, orders, and business performance\n"
        "- 🌊 **Streaming Responses**: Server-Sent Events (SSE) for progressive answer generation with live status updates\n"
        "- 📝 **Human-Friendly Summaries**: AI-generated comprehensive analysis (20-30 sentences) without exposing technical IDs\n"
        "- 🎯 **Smart Query Interpretation**: Handles synonyms, abbreviations, and intelligent field mapping\n\n"
        "**Technology Stack:**\n"
        "- LLM: Google Gemini (gemini-2.0-flash-lite) / Ollama (llama3.2)\n"
        "- Vector Store: Pinecone (768-dimensional embeddings, cosine similarity)\n"
        "- Database: PostgreSQL with SQLAlchemy\n"
        "- Authentication: Clerk JWT tokens with organization-based access control\n"
        "- Framework: FastAPI with async/await patterns\n\n"
        "**Access Control:**\n"
        "- Requires valid Clerk authentication token\n"
        "- Restricted to admin roles only\n"
        "- All queries automatically filtered by authenticated user's organization\n\n"
        "**Use Cases:**\n"
        "Ask questions like: 'What are my top selling products this month?', 'Show customer purchase trends', "
        "'Which products have low inventory?', 'What's my total revenue by category?'"
    ),
    version="1.0.0",
    servers=[{"url": "http://localhost:8000", "description": "Development"}],
    swagger_ui_parameters={
        "persistAuthorization": True,
    },
)

# Include routers
app.include_router(ask_router)


# Configure OpenAPI schema with Bearer token authentication
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    # Import here to get the original openapi function
    from fastapi.openapi.utils import get_openapi
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        servers=app.servers,
    )
    
    # Add Bearer token security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "Authorization": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your Clerk JWT token",
        }
    }
    
    # Apply security globally to all endpoints
    openapi_schema["security"] = [{"Authorization": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Add Scalar API reference endpoint
@app.get("/api-reference", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url="/openapi.json",
        title="Eclipso NL2SQL Service API Reference",
        theme=Theme.MOON,
        dark_mode=True,
    )

# Add root route that redirects to /api-reference
from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url="/api-reference", status_code=302)
