from langchain_google_genai import GoogleGenerativeAIEmbeddings

embedding = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    # google_api_key="",
)


def prepare_schema_for_embedding(schema_chunks):
    documents = []

    for chunk in schema_chunks:
        table = chunk["table"]
        text = chunk["text"]

        # Optional: add structured prefix for clarity
        doc_text = f"""
        Database Table: {table}

        Schema Details:
        {text}

        Include all column types and enum values explicitly.
        Include all foreign key relationships and inbound references.
        This is a self-contained description of the table for semantic understanding.
        """

        documents.append(doc_text.strip())

    return documents


# from langchain_core.documents import Document
# from pinecone import Pinecone, ServerlessSpec
# from langchain_pinecone import PineconeVectorStore

# # Initialize Pinecone
# pc = Pinecone(
#     api_key="YOUR_PINECONE_API_KEY",
# )

# # Connect to the existing serverless index
# index = pc.Index("dense-index-final")

# # Create Pinecone vector store
# vector_store = PineconeVectorStore(embedding=embedding, index=index)

# # Prepare documents with flattened, Pinecone-compatible metadata
# documents = []
# for i, chunk in enumerate(schema_chunks):
#     table = chunk["table"]
#     columns_info = []
#     for col in schema_info[table]["columns"]:
#         col_str = f"{col['name']} ({col['type']})"
#         if "enum_values" in col:
#             col_str += f" enum={col['enum_values']}"
#         columns_info.append(col_str)

#     foreign_keys_info = []
#     for fk in schema_info[table]["foreign_keys"]:
#         col_names = ", ".join(fk["column"])
#         foreign_keys_info.append(f"{col_names} → {fk['references']}")

#     doc = Document(
#         page_content=schema_docs[i],
#         metadata={
#             "table": table,
#             "columns": columns_info,  # list of strings
#             "num_columns": len(columns_info),
#             "foreign_keys": foreign_keys_info,  # list of strings
#             "num_foreign_keys": len(foreign_keys_info),
#         },
#     )
#     documents.append(doc)

# # Add documents to Pinecone vector store
# vector_store.add_documents(documents=documents)
