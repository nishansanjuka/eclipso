# NL2SQL Service

Natural Language to SQL Query Generation Service using LangChain and Ollama.

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
   # Edit .env with your database credentials
   ```

4. **Run the service:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## API Endpoints

### POST /ask
Convert natural language to SQL query.

**Request:**
```json
{
  "question": "Show me all customers who made purchases last month"
}
```

**Response:**
```json
{
  "question": "Show me all customers who made purchases last month",
  "sql_query": "SELECT * FROM customers WHERE ...",
  "success": true,
  "error": null
}
```

### POST /query
Execute a PostgreSQL query and return results as JSON.

**Request:**
```json
{
  "query": "SELECT id, name, email FROM customers LIMIT 10"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "John Doe", "email": "john@example.com"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
  ],
  "row_count": 2,
  "error": null
}
```

### GET /ask/health
Health check for the ask service.

### GET /query/health
Health check for the query service (includes database connectivity test).

### GET /
Root endpoint with service information.

### GET /docs
Interactive API documentation (Swagger UI).

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `LLM_MODEL_NAME`: Ollama model name (default: llama3.2)
