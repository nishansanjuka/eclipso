# NL2SQL Service

Natural Language to SQL Query Generation Service using LangChain and Google Gemini.

## Overview

This service converts natural language questions into SQL queries, executes them against a PostgreSQL database, and returns human-readable answers. It uses Google's Gemini AI model for intelligent query generation and response formatting.

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials:
   # - DATABASE_URL: Your PostgreSQL connection string
   # - GOOGLE_API_KEY: Your Google AI API key
   # - CLERK_SECRET_KEY: Your Clerk secret key for authentication
   # - LLM_MODEL_NAME: (Optional) Default is gemini-2.0-flash-exp
   ```

4. **Run the service:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## API Endpoints

**⚠️ Authentication Required:** All endpoints require Clerk authentication via Bearer token in the Authorization header.

### POST /ask/
Convert natural language to SQL query, execute it, and return human-readable answer.

**Headers:**
```
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "What are the top 5 selling products?"
}
```

**Response:**
```json
{
  "question": "What are the top 5 selling products?",
  "sql_query": "SELECT product_name, SUM(quantity) as total_sold FROM sales GROUP BY product_name ORDER BY total_sold DESC LIMIT 5;",
  "results": [
    {"product_name": "Product A", "total_sold": 150},
    {"product_name": "Product B", "total_sold": 120}
  ],
  "answer": "The top 5 selling products are: Product A with 150 units sold, Product B with 120 units sold...",
  "success": true,
  "error": null
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Authorization: Bearer <your_clerk_session_token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all customers who made purchases last month"}'
```

### GET /ask/health
Health check for the ask service.

**Response:**
```json
{
  "status": "healthy",
  "service": "ask",
  "model": "gemini-2.0-flash-exp"
}
```

### GET /
Root endpoint with service information and available endpoints.

**Response:**
```json
{
  "message": "NL2SQL Service is running",
  "version": "1.0.0",
  "endpoints": {
    "ask": "/ask",
    "ask_health": "/ask/health",
    "docs": "/docs"
  }
}
```

### GET /docs
Interactive API documentation (Swagger UI).

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db_name` |
| `GOOGLE_API_KEY` | ✅ Yes | Google AI API key for Gemini | `AIza...` |
| `CLERK_SECRET_KEY` | ✅ Yes | Clerk secret key (starts with sk_test_ or sk_live_) | `sk_test_...` |
| `LLM_MODEL_NAME` | ❌ No | LLM model name (default: gemini-2.0-flash-exp) | `gemini-2.0-flash-exp` |

## Authentication

This service uses [Clerk](https://clerk.com) for authentication. All endpoints (except `/`, `/docs`, and `/ask/health`) require a valid Clerk session token.

### Getting a Clerk Token

**Frontend Integration (Recommended):**
```javascript
// Using Clerk React SDK
import { useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { getToken } = useAuth();
  
  const askQuestion = async (question) => {
    const token = await getToken();
    const response = await fetch('http://localhost:8000/ask/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });
    return response.json();
  };
}
```

**Testing with curl:**
```bash
# 1. Get your session token from Clerk Dashboard or browser dev tools
# 2. Use it in your request
curl -X POST http://localhost:8000/ask/ \
  -H "Authorization: Bearer <your_session_token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all products"}'
```

## Architecture

### Three-Step Pipeline

1. **Natural Language → SQL**: Uses Google Gemini with comprehensive PostgreSQL system prompts to generate accurate SQL queries
2. **SQL → Data**: Executes the generated query against PostgreSQL database
3. **Data → Human Answer**: Converts JSON results into natural, readable responses

### Key Components

- **Ask Service** (`src/modules/ask/ask_service.py`): Orchestrates the three-step pipeline
- **Query Service** (`src/modules/query/query_service.py`): Handles database query execution
- **Reasoning Service** (`src/modules/ask/reasoning_service.py`): Converts data to human-readable answers
- **Gemini LLM Client** (`src/modules/llm/gemini_client.py`): Interfaces with Google Gemini API
- **Auth Middleware** (`src/middleware/auth.py`): Clerk authentication using official SDK

### Features

✅ **Intelligent SQL Generation**: PostgreSQL-specific prompts with 12+ syntax rules  
✅ **Auto Schema Detection**: Dynamically retrieves database schema for context  
✅ **Query Sanitization**: Removes markdown formatting from LLM responses  
✅ **Human-Readable Responses**: Natural language answers from data  
✅ **Secure Authentication**: Clerk JWT verification  
✅ **Error Handling**: Comprehensive exception handling and error messages  

## Development

### Project Structure
```
apps/nl2sql-service/
├── main.py                          # FastAPI application entry point
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
├── src/
│   ├── middleware/
│   │   └── auth.py                 # Clerk authentication middleware
│   ├── modules/
│   │   ├── ask/
│   │   │   ├── ask_service.py      # Main NL2SQL orchestration
│   │   │   ├── reasoning_service.py # Human response generation
│   │   │   └── constants/
│   │   │       ├── system_prompt.py # PostgreSQL SQL generation rules
│   │   │       └── reasoning_prompt.py # Response formatting rules
│   │   ├── query/
│   │   │   └── query_service.py    # Database query execution
│   │   └── llm/
│   │       └── gemini_client.py    # Google Gemini integration
│   ├── routes/
│   │   └── ask_router.py           # API endpoints
│   └── shared/
│       └── utils/
│           └── get_db_info.py      # Database schema utilities
```

### Adding New Features

1. **Custom System Prompts**: Modify `src/modules/ask/constants/system_prompt.py`
2. **New LLM Models**: Add clients in `src/modules/llm/`
3. **Additional Routes**: Create new routers in `src/routes/`

## Troubleshooting

**Issue: "Authentication failed"**
- Verify `CLERK_SECRET_KEY` is set correctly in `.env`
- Ensure token is valid and not expired
- Check Authorization header format: `Bearer <token>`

**Issue: "Connection refused" to database**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database credentials and permissions

**Issue: "Invalid SQL query generated"**
- Check if database schema is properly detected
- Review `system_prompt.py` for PostgreSQL syntax rules
- Ensure question is clear and specific

## License

MIT
