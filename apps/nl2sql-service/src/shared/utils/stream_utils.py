import json
from typing import Dict, Any, Optional


def create_stream_event(status: str, data: Optional[Dict[str, Any]] = None) -> str:
    # Create a Server-Sent Events (SSE) formatted message
    # Args:
    #   status: Current processing status
    #   data: Optional data to include in the event
    # Returns:
    #   SSE formatted string
    
    event = {
        "status": status,
        "data": data or {}
    }
    return f"data: {json.dumps(event)}\n\n"
