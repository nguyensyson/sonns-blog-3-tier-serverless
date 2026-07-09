from typing import Any


def success_response(data: Any = None, message: str = "OK") -> dict:
    """Standard success envelope: { success, data, message }."""
    return {"success": True, "data": data, "message": message}
