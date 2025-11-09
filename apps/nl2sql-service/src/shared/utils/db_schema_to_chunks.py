def generate_schema_chunks(schema: dict):
    inbound_map = {}

    # Build inbound map
    for table, defn in schema.items():
        for fk in defn.get("foreign_keys", []):
            target = fk["references"]
            col = ", ".join(fk["column"])

            if target not in inbound_map:
                inbound_map[target] = []

            inbound_map[target].append({"from": table, "column": col})

    # Detect join tables (many-to-many)
    def is_join_table(defn):
        return (
            len(defn.get("columns", [])) == 2
            and len(defn.get("foreign_keys", [])) == 2
            and all(col.get("type") == "UUID" for col in defn.get("columns", []))
        )

    chunks = []

    for table, defn in schema.items():
        outbound = defn.get("foreign_keys", [])
        inbound = inbound_map.get(table, [])

        chunk = f"TABLE: {table}\n\nCOLUMNS:\n"

        for col in defn.get("columns", []):
            chunk += f"- {col['name']} {col['type']}\n"

        chunk += "\nFOREIGN KEYS (outbound):\n"
        if not outbound:
            chunk += "- None\n"
        else:
            for fk in outbound:
                col = ", ".join(fk["column"])
                chunk += f"- {col} → {fk['references']}\n"

        chunk += "\nREFERENCED BY (inbound):\n"
        if not inbound:
            chunk += "- None\n"
        else:
            for ref in inbound:
                chunk += f"- {ref['from']}.{ref['column']}\n"

        # Relationship summary
        chunk += "\nRELATIONSHIP SUMMARY:\n"

        if is_join_table(defn):
            # many-to-many
            fk1, fk2 = outbound
            chunk += f"- many ↔ many ({fk1['references']} ↔ {fk2['references']}) via {table}\n"
        else:
            # one-to-many outbound
            for fk in outbound:
                chunk += f"- {table} many → 1 {fk['references']}\n"

            # inbound (reverse direction)
            for ref in inbound:
                chunk += f"- {table} 1 ← many {ref['from']}\n"

        chunks.append({"table": table, "text": chunk.strip()})

    return chunks
