from sqlalchemy import create_engine, inspect


def get_database_schema(database_url: str) -> dict:
    # Retrieve database schema information including tables, columns, and foreign keys.
    # Args:
    #   database_url: SQLAlchemy database connection string
    # Returns:
    #   Dictionary containing schema information for all tables

    engine = create_engine(database_url)
    inspector = inspect(engine)

    schema_info = {}

    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        foreign_keys = inspector.get_foreign_keys(table_name)
        schema_info[table_name] = {
            "columns": [{"name": c["name"], "type": str(c["type"])} for c in columns],
            "foreign_keys": [
                {
                    "column": fk["constrained_columns"],
                    "references": fk["referred_table"],
                }
                for fk in foreign_keys
            ],
        }

    engine.dispose()
    return schema_info


# # %pip install sqlalchemy
# from sqlalchemy import create_engine, inspect
# from sqlalchemy.types import Enum

# def get_database_schema(database_url: str) -> dict:
#     """
#     Retrieve database schema information including tables, columns, foreign keys, and enum values.

#     Args:
#         database_url: SQLAlchemy database connection string

#     Returns:
#         Dictionary containing schema information for all tables
#     """
#     engine = create_engine(database_url)
#     inspector = inspect(engine)

#     schema_info = {}

#     for table_name in inspector.get_table_names():
#         columns = inspector.get_columns(table_name)
#         foreign_keys = inspector.get_foreign_keys(table_name)

#         column_info = []
#         for c in columns:
#             col_type = c["type"]
#             col_dict = {"name": c["name"], "type": str(col_type)}

#             # If column is Enum, include allowed values
#             if isinstance(col_type, Enum):
#                 col_dict["enum_values"] = col_type.enums

#             column_info.append(col_dict)

#         schema_info[table_name] = {
#             "columns": column_info,
#             "foreign_keys": [
#                 {
#                     "column": fk["constrained_columns"],
#                     "references": fk["referred_table"],
#                 }
#                 for fk in foreign_keys
#             ],
#         }

#     engine.dispose()
#     return schema_info
