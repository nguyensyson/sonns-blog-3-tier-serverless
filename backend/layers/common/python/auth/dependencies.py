from typing import Optional

import jwt as pyjwt
from fastapi import Header

from auth.jwt_handler import decode_token
from schemas.user import CurrentUser
from utils.exceptions import UnauthorizedError


def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def get_current_user_optional(authorization: Optional[str] = Header(default=None)) -> Optional[CurrentUser]:
    """For 🔓 OPTIONAL AUTH endpoints: never raises. Returns None when there is
    no token, or when the token is missing/invalid/expired, so the route can
    still serve the public response."""
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    try:
        payload = decode_token(token, expected_type="access")
    except pyjwt.PyJWTError:
        return None
    return CurrentUser(userId=payload["sub"], email=payload.get("email", ""))


def get_current_user_required(authorization: Optional[str] = Header(default=None)) -> CurrentUser:
    """For 🔒 REQUIRED AUTH endpoints: raises UnauthorizedError (-> 401) at the
    dependency layer, before the route body (and therefore the service layer)
    ever runs."""
    token = _extract_bearer_token(authorization)
    if not token:
        raise UnauthorizedError("Thiếu Bearer token.")
    try:
        payload = decode_token(token, expected_type="access")
    except pyjwt.PyJWTError:
        raise UnauthorizedError("Token không hợp lệ hoặc đã hết hạn.")
    return CurrentUser(userId=payload["sub"], email=payload.get("email", ""))
