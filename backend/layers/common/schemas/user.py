from pydantic import BaseModel


class CurrentUser(BaseModel):
    """Minimal identity extracted from a decoded JWT. Lives in the shared
    layer (not in the user module) specifically so posts/tasks can depend on
    it without importing anything from modules/user - per the "no cross-module
    imports" rule, anything shared must live in common."""

    userId: str
    email: str
