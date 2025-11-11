# NL2SQL Service

Natural Language to SQL Query Generation Service with AI-powered SQL generation, real-time streaming, and enterprise security.

## Overview

This service converts natural language questions into SQL queries, executes them against a PostgreSQL database, and returns human-readable answers. It supports both standard and streaming responses with real-time progress updates.

**Key Features:**
- 🤖 AI-powered SQL generation using Google Gemini or Ollama
- 🔄 Real-time streaming with Server-Sent Events (SSE)
- 🔒 Enterprise-grade security with Clerk authentication and role-based access control
- 🎯 Multi-tenant architecture with automatic org-level data isolation
- 🗃️ Vector store for intelligent schema retrieval (Pinecone)
- 📚 Interactive API documentation with Scalar
- 🔗 Automated Postman collection sync

## Setup

### 1. Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db_name

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# LLM Configuration
LLM_MODEL_NAME=gemini-2.0-flash-exp
GOOGLE_API_KEY=your_google_api_key

# Or use Ollama (local LLM)
# LLM_MODEL_NAME=llama3.2
# OLLAMA_BASE_URL=http://localhost:11434

# Pinecone Vector Store
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Postman Integration (Optional)
POSTMAN_API_KEY=your_postman_api_key
POSTMAN_COLLECTION_ID=your_collection_id
```

### 4. Run the Service

```bash
uvicorn main:app --reload --port 8001
```

The service will be available at:
- API: http://localhost:8001
- Interactive Docs (Scalar): http://localhost:8001/docs
- OpenAPI Schema: http://localhost:8001/openapi.json

## API Endpoints

**🔒 Authentication Required:** All endpoints require Clerk authentication via Bearer token.  
**👥 Role-Based Access:** Only users with `admin` role can access NL2SQL endpoints.  
**🏢 Multi-Tenant:** All queries automatically filter data by organization ID.

### POST /ask/

Convert natural language to SQL, execute query, and return human-readable answer.

**Request:**
```bash
curl -X POST http://localhost:8001/ask/ \
  -H "Authorization: Bearer <clerk_session_token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the top 5 selling products this month?"}'
```

**Response:**
```json
{
  "question": "What are the top 5 selling products this month?",
  "sql_query": "SELECT p.name, SUM(oi.quantity) as total_sold FROM products p JOIN order_items oi ON p.id = oi.product_id WHERE oi.created_at >= date_trunc('month', CURRENT_DATE) GROUP BY p.name ORDER BY total_sold DESC LIMIT 5;",
  "results": [
    {"name": "Product A", "total_sold": 150},
    {"name": "Product B", "total_sold": 120}
  ],
  "answer": "The top 5 selling products this month are: Product A with 150 units sold, Product B with 120 units sold...",
  "success": true,
  "error": null
}
```

### POST /ask/stream

**Real-time streaming** endpoint with progressive status updates via Server-Sent Events (SSE).

**Request:**
```bash
curl -X POST http://localhost:8001/ask/stream \
  -H "Authorization: Bearer <clerk_session_token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me revenue by product category"}' \
  --no-buffer
```

**SSE Event Stream:**
```
data: {"status": "retrieving_context", "data": {"message": "Finding relevant database tables..."}}

data: {"status": "generating_query", "data": {"message": "Converting question to SQL..."}}

data: {"status": "executing_query", "data": {"message": "Fetching data from database..."}}

data: {"status": "generating_answer", "data": {"message": "Analyzing results...", "chunk": "The revenue breakdown by category shows..."}}

data: {"status": "generating_answer", "data": {"chunk": " Electronics: $45,000, Clothing: $32,000..."}}

data: {"status": "completed", "data": {"question": "...", "sql_query": "...", "results": [...], "answer": "...", "success": true}}
```

**Status Flow:**
1. `retrieving_context` - Finding relevant tables via vector store
2. `generating_query` - AI generates SQL from natural language
3. `executing_query` - Running SQL against PostgreSQL
4. `generating_answer` - Streaming human-readable answer (progressive chunks)
5. `completed` - Final result with complete data
6. `error` - If any step fails

### GET /ask/health

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "service": "ask",
  "model": "gemini-2.0-flash-exp"
}
```

### GET /docs

Interactive API documentation powered by [Scalar](https://github.com/scalar/scalar).

**Features:**
- Try out endpoints with Bearer token authentication
- View request/response schemas
- Explore all available operations
- Copy code examples in multiple languages

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `CLERK_SECRET_KEY` | ✅ Yes | Clerk secret key for JWT verification | `sk_test_...` or `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk publishable key | `pk_test_...` or `pk_live_...` |
| `LLM_MODEL_NAME` | ✅ Yes | LLM model name | `gemini-2.0-flash-exp` or `llama3.2` |
| `GOOGLE_API_KEY` | ⚠️ Conditional | Required for Gemini models | `AIza...` |
| `OLLAMA_BASE_URL` | ⚠️ Conditional | Required for Ollama models | `http://localhost:11434` |
| `PINECONE_API_KEY` | ✅ Yes | Pinecone API key for vector store | `pcsk_...` |
| `PINECONE_INDEX_NAME` | ✅ Yes | Pinecone index name | `database-schema` |
| `POSTMAN_API_KEY` | ❌ No | Postman API key (for collection sync) | `PMAK-...` |
| `POSTMAN_COLLECTION_ID` | ❌ No | Postman collection ID (for sync) | `12345678-1234-...` |

## Authentication & Authorization

This service uses [Clerk](https://clerk.com) for authentication and implements role-based access control (RBAC).

### Authentication Flow

1. **User authenticates** via Clerk in your frontend application
2. **Frontend obtains session token** using Clerk SDK
3. **Token sent to NL2SQL service** in `Authorization: Bearer <token>` header
4. **Service verifies token** using Clerk SDK and extracts user metadata
5. **Request proceeds** if user has required role and belongs to valid organization

### Role-Based Access Control

**Admin-Only Access:**
All NL2SQL endpoints require the `admin` role. This is configured in `ask_router.py`:

```python
ALLOWED_ROLES = ["admin"]  # Only admins can access NL2SQL
```

To grant access to additional roles, update the `ALLOWED_ROLES` list:

```python
ALLOWED_ROLES = ["admin", "analyst", "manager"]
```

### Multi-Tenant Data Isolation

**Automatic Organization Filtering:**
Every SQL query is automatically filtered by the authenticated user's organization ID (`org_id`). Users can **only** access data belonging to their organization.

**Security Guarantees:**
- ✅ Users cannot access other organizations' data
- ✅ SQL queries automatically include org_id filter
- ✅ No sensitive IDs (user_id, org_id) exposed in responses
- ✅ JWT token verification on every request

### Frontend Integration

**React Example (Clerk SDK):**
```javascript
import { useAuth } from '@clerk/clerk-react';

function AskQuestion() {
  const { getToken } = useAuth();
  
  const askQuestion = async (question) => {
    const token = await getToken();
    
    const response = await fetch('http://localhost:8001/ask/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });
    
    return response.json();
  };
  
  // Use askQuestion() in your component
}
```

**Streaming Example:**
```javascript
const askQuestionStream = async (question) => {
  const token = await getToken();
  
  const response = await fetch('http://localhost:8001/ask/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        console.log('Event:', data.status, data.data);
        
        if (data.status === 'completed') {
          // Final result
          return data.data;
        }
      }
    }
  }
};
```

## Architecture

### AI-Powered Pipeline

The service uses a sophisticated three-step pipeline with vector-enhanced schema retrieval:

1. **Schema Retrieval (Vector Store)**
   - Relevant database tables/columns retrieved from Pinecone vector store
   - Semantic search matches question context to schema embeddings
   - Provides focused schema context to LLM (avoids token limits)

2. **Natural Language → SQL (LLM)**
   - Google Gemini or Ollama converts question to PostgreSQL query
   - Uses comprehensive system prompt with 12+ PostgreSQL syntax rules
   - Automatically injects org_id security filter
   - Validates and sanitizes generated SQL

3. **SQL → Data (Database)**
   - Executes sanitized query against PostgreSQL
   - Returns structured JSON results
   - Handles errors and edge cases

4. **Data → Human Answer (LLM)**
   - LLM converts JSON data into natural language
   - Progressive streaming of answer chunks (SSE mode)
   - No sensitive IDs exposed in response

### Key Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **AskService** | Orchestrates entire pipeline | Python, LangChain |
| **QueryService** | Database query execution | SQLAlchemy, PostgreSQL |
| **ReasoningService** | Converts data to human answers | LLM streaming |
| **GeminiClient/OllamaClient** | LLM interface | Google AI SDK / Ollama |
| **VectorStore** | Schema retrieval | Pinecone |
| **Auth Middleware** | JWT verification, RBAC | Clerk SDK |
| **FastAPI** | REST API, SSE streaming | FastAPI, Pydantic |

### Security Architecture

**Multi-Layer Security:**
1. **Authentication:** Clerk JWT token verification
2. **Authorization:** Role-based access control (admin-only)
3. **Data Isolation:** Automatic org_id filtering in all queries
4. **SQL Injection Prevention:** Parameterized queries, query sanitization
5. **Privacy:** No user_id or org_id exposed in responses

### Features

✅ **Real-time Streaming** - Progressive status updates via SSE  
✅ **Vector-Enhanced Retrieval** - Intelligent schema selection with Pinecone  
✅ **Multi-Model Support** - Google Gemini or Ollama (local)  
✅ **PostgreSQL-Specific** - Optimized prompts with 12+ syntax rules  
✅ **Auto Schema Detection** - Dynamic database introspection  
✅ **Query Sanitization** - Removes markdown, validates SQL  
✅ **Human-Readable Responses** - Natural language answers  
✅ **Enterprise Security** - Clerk auth, RBAC, multi-tenant isolation  
✅ **Interactive Docs** - Scalar UI with Bearer token support  
✅ **Postman Sync** - Automated collection updates  

## Development

### Project Structure

```
apps/nl2sql-service/
├── main.py                          # FastAPI app with Scalar docs
├── requirements.txt                 # Python dependencies
├── package.json                     # Node.js scripts (Postman sync)
├── .env                             # Environment variables
├── scripts/
│   ├── patch-postman.mjs           # Adds Clerk auth to Postman collection
│   ├── upload-postman.mjs          # Uploads collection to Postman
│   ├── pre-request.js              # Postman pre-request script
│   └── postman-env-dev.json        # Postman environment variables
├── src/
│   ├── shared/
│   │   ├── config.py               # Environment configuration
│   │   ├── middleware/
│   │   │   └── auth.py             # Clerk auth, RBAC dependencies
│   │   └── utils/
│   │       └── get_db_info.py      # Database schema utilities
│   ├── modules/
│   │   ├── ask/
│   │   │   ├── ask_service.py      # Main NL2SQL orchestration
│   │   │   ├── reasoning_service.py # Human response generation
│   │   │   └── constants/
│   │   │       ├── system_prompt.py # PostgreSQL SQL rules
│   │   │       └── reasoning_prompt.py # Response formatting
│   │   ├── query/
│   │   │   └── query_service.py    # Database query execution
│   │   └── llm/
│   │       ├── gemini_client.py    # Google Gemini integration
│   │       └── ollama_client.py    # Ollama integration
│   └── routes/
│       └── ask_router.py           # API endpoints (/ask, /ask/stream)
└── notebooks/
    ├── ask-question.ipynb          # Testing notebook
    └── extract-dbschema.ipynb      # Schema extraction for Pinecone
```

### Scripts

**Postman Collection Sync:**
```bash
# Sync OpenAPI → Postman (with Clerk auth)
pnpm run sync:postman
```

This script:
1. Generates OpenAPI spec from FastAPI
2. Converts to Postman collection v2
3. Injects Clerk authentication pre-request script
4. Uploads to Postman via API

**Manual Steps:**
```bash
# Generate OpenAPI → Postman JSON
npx openapi-to-postmanv2 -s http://localhost:8001/openapi.json -o postman_collection.json

# Patch with Clerk auth
node scripts/patch-postman.mjs

# Upload to Postman
node scripts/upload-postman.mjs
```

### Adding New Features

**1. Custom System Prompts:**
Edit `src/modules/ask/constants/system_prompt.py` to modify SQL generation rules.

**2. New LLM Models:**
Create new client in `src/modules/llm/` (e.g., `claude_client.py`), then update `ask_service.py`.

**3. Additional Endpoints:**
Create new router in `src/routes/`, then register in `main.py`.

**4. Custom RBAC Roles:**
Update `ALLOWED_ROLES` in `ask_router.py`:
```python
ALLOWED_ROLES = ["admin", "analyst", "manager"]
```

### Testing

**Interactive Testing:**
1. Start service: `uvicorn main:app --reload --port 8001`
2. Open Scalar docs: http://localhost:8001/docs
3. Click "Authorize" and enter Clerk Bearer token
4. Test endpoints directly in browser

**Jupyter Notebooks:**
```bash
cd notebooks
jupyter notebook
# Open ask-question.ipynb
```

**curl Testing:**
```bash
# Get Clerk token from your app's browser dev tools
export CLERK_TOKEN="your_session_token_here"

# Standard endpoint
curl -X POST http://localhost:8001/ask/ \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me top products"}'

# Streaming endpoint
curl -X POST http://localhost:8001/ask/stream \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is our revenue this month?"}' \
  --no-buffer
```

## Troubleshooting

### Authentication Issues

**Error: "Invalid token" or "Authentication failed"**
- ✅ Verify `CLERK_SECRET_KEY` is correct (starts with `sk_test_` or `sk_live_`)
- ✅ Ensure token is not expired (Clerk tokens expire after 1 hour)
- ✅ Check `Authorization` header format: `Bearer <token>` (note the space)
- ✅ Confirm token was generated from same Clerk instance

**Error: "Insufficient permissions" or 403 Forbidden**
- ✅ User must have `admin` role in Clerk organization
- ✅ Update `ALLOWED_ROLES` in `ask_router.py` if needed
- ✅ Verify user is member of an organization (org_id must exist)

### Database Issues

**Error: "Connection refused" or "Could not connect to database"**
- ✅ Verify `DATABASE_URL` is correct and accessible
- ✅ Ensure PostgreSQL is running: `pg_isready`
- ✅ Check database credentials and permissions
- ✅ Test connection: `psql $DATABASE_URL`

**Error: "Invalid SQL query generated"**
- ✅ Check if database schema is properly indexed in Pinecone
- ✅ Run `notebooks/extract-dbschema.ipynb` to update vector store
- ✅ Review `system_prompt.py` for PostgreSQL syntax rules
- ✅ Ensure question is clear and references actual table/column names

### LLM Issues

**Error: "Model not found" or "API key invalid"**
- ✅ For Gemini: Verify `GOOGLE_API_KEY` is valid
- ✅ For Ollama: Ensure Ollama is running (`ollama serve`)
- ✅ Check `LLM_MODEL_NAME` matches available models
- ✅ Test Gemini: `curl https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_API_KEY`
- ✅ Test Ollama: `curl http://localhost:11434/api/tags`

**Error: "Rate limit exceeded"**
- ✅ Gemini has rate limits (check Google AI Studio dashboard)
- ✅ Consider using Ollama for local, unlimited inference
- ✅ Implement request throttling if needed

### Vector Store Issues

**Error: "Pinecone connection failed" or "Index not found"**
- ✅ Verify `PINECONE_API_KEY` is valid
- ✅ Check `PINECONE_INDEX_NAME` exists in Pinecone dashboard
- ✅ Ensure index has embeddings (run `extract-dbschema.ipynb`)
- ✅ Confirm index dimensions match embedding model (1536 for text-embedding-ada-002)

### Streaming Issues

**Problem: SSE stream cuts off or doesn't update**
- ✅ Use `--no-buffer` with curl
- ✅ Disable nginx buffering (`X-Accel-Buffering: no` header)
- ✅ In JavaScript, use `EventSource` or fetch with streaming reader
- ✅ Check browser dev tools for connection drops

### Postman Sync Issues

**Error: "Failed to upload collection"**
- ✅ Verify `POSTMAN_API_KEY` is valid (generate from Postman settings)
- ✅ Check `POSTMAN_COLLECTION_ID` exists and is accessible
- ✅ Ensure service is running before sync: `uvicorn main:app --port 8001`
- ✅ Run manually: `node scripts/upload-postman.mjs`

## Performance Tips

**Optimize Query Performance:**
- ✅ Create database indexes on frequently queried columns
- ✅ Use Pinecone vector store for fast schema retrieval (avoid full schema dumps)
- ✅ Limit result sets (LLM adds `LIMIT` clauses automatically)

**Reduce Latency:**
- ✅ Use Ollama for local LLM inference (no API latency)
- ✅ Cache frequently asked questions (add Redis layer)
- ✅ Use `/ask/stream` for better perceived performance

**Scale for Production:**
- ✅ Deploy with Gunicorn/Uvicorn workers: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`
- ✅ Use connection pooling for PostgreSQL (SQLAlchemy pool)
- ✅ Add rate limiting (e.g., SlowAPI)
- ✅ Monitor with logging/APM tools

## Security Best Practices

**Production Checklist:**
- ✅ Use `sk_live_*` Clerk keys (not `sk_test_*`)
- ✅ Enable HTTPS/TLS for all endpoints
- ✅ Rotate API keys regularly (Clerk, Pinecone, Google AI)
- ✅ Implement rate limiting per user/org
- ✅ Audit log all SQL queries (add logging middleware)
- ✅ Review generated SQL queries for sensitive data access
- ✅ Set up monitoring/alerts for auth failures
- ✅ Use environment variables (never hardcode secrets)

## License

MIT
# Trigger deployment
