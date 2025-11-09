import re


def clean_sql_query(sql_query: str) -> str:
    # Remove markdown formatting and extra whitespace from SQL query.
    # Args:
    #   sql_query: Raw SQL query string from LLM
    # Returns:
    #   Cleaned SQL query
    
    # Remove markdown code blocks (```sql ... ``` or ``` ... ```)
    sql_query = re.sub(r"```sql\s*", "", sql_query)
    sql_query = re.sub(r"```\s*", "", sql_query)
    
    # Remove leading/trailing whitespace
    sql_query = sql_query.strip()
    
    return sql_query


def is_valid_sql(sql_query: str) -> bool:
    # Validate if response is actual SQL query.
    # Args:
    #   sql_query: Query string to validate
    # Returns:
    #   True if valid SQL, False otherwise
    
    sql_keywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "WITH"]
    return any(
        sql_query.upper().strip().startswith(keyword) for keyword in sql_keywords
    )
