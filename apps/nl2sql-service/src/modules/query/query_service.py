from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Dict, Any


class QueryService:
    def __init__(self, database_url: str):
        """
        Initialize the Query service with database connection.

        Args:
            database_url: SQLAlchemy database connection string
        """
        self.database_url = database_url
        self.engine = create_engine(database_url)

    def query(self, sql_query: str) -> List[Dict[str, Any]]:
        """
        Execute a SQL query against the database and return results as JSON.

        Args:
            sql_query: PostgreSQL query string to execute

        Returns:
            List of dictionaries representing query results

        Raises:
            SQLAlchemyError: If query execution fails
        """
        try:
            with self.engine.connect() as connection:
                result = connection.execute(text(sql_query))
                
                # Convert result to list of dictionaries
                columns = result.keys()
                rows = result.fetchall()
                
                # Convert each row to a dictionary
                json_result = [dict(zip(columns, row)) for row in rows]
                
                return json_result
                
        except SQLAlchemyError as e:
            raise SQLAlchemyError(f"Query execution failed: {str(e)}")
        
    def __del__(self):
        """Cleanup: dispose of the engine when service is destroyed."""
        if hasattr(self, 'engine'):
            self.engine.dispose()
