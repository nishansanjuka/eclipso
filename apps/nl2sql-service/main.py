from fastapi import FastAPI
from src.routes.ask_router import router as ask_router
from src.routes.query_router import router as query_router


app = FastAPI(
    title="NL2SQL Service",
    description="Natural Language to SQL Query Generation Service",
    version="1.0.0",
)

# Include routers
app.include_router(ask_router)
app.include_router(query_router)


@app.get("/")
async def root():
    return {
        "message": "NL2SQL Service is running",
        "version": "1.0.0",
        "endpoints": {
            "ask": "/ask",
            "ask_health": "/ask/health",
            "query": "/query",
            "query_health": "/query/health",
            "docs": "/docs",
        },
    }
