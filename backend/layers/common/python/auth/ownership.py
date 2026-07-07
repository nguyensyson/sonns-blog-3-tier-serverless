from utils.exceptions import ForbiddenError


def assert_owner(
    owner_id: str,
    current_user_id: str,
    message: str = "Bạn không có quyền thao tác trên tài nguyên này.",
) -> None:
    """Shared 🔒+OWNER check: raises ForbiddenError (-> 403) when the resource's
    owner does not match the caller. Used by service-layer functions in
    posts and tasks instead of repeating the comparison in every endpoint."""
    if owner_id != current_user_id:
        raise ForbiddenError(message)
