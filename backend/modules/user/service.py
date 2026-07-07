from typing import Optional

import bcrypt
import jwt as pyjwt

import repository
from auth.jwt_handler import create_access_token, create_refresh_token, decode_token
from utils.exceptions import ConflictError, NotFoundError, UnauthorizedError, ValidationAppError


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _issue_tokens(user: dict) -> dict:
    return {
        "accessToken": create_access_token(user["userId"], user["email"]),
        "refreshToken": create_refresh_token(user["userId"], user["email"]),
        "tokenType": "Bearer",
    }


def register(email: str, password: str, display_name: str) -> dict:
    if repository.get_by_email(email):
        raise ConflictError("Email đã được sử dụng.")
    user = repository.create(email=email, password_hash=_hash_password(password), display_name=display_name)
    return _issue_tokens(user)


def login(email: str, password: str) -> dict:
    user = repository.get_by_email(email)
    if not user or not _verify_password(password, user["passwordHash"]):
        raise UnauthorizedError("Email hoặc mật khẩu không đúng.")
    return _issue_tokens(user)


def refresh(refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except pyjwt.PyJWTError:
        raise UnauthorizedError("Refresh token không hợp lệ hoặc đã hết hạn.")
    user = repository.get_by_id(payload["sub"])
    if not user:
        raise UnauthorizedError("Tài khoản không còn tồn tại.")
    return _issue_tokens(user)


def get_profile(user_id: str) -> dict:
    user = repository.get_by_id(user_id)
    if not user:
        raise NotFoundError("Không tìm thấy người dùng.")
    return user


def update_profile(user_id: str, display_name: str, avatar_url: Optional[str]) -> dict:
    if not repository.get_by_id(user_id):
        raise NotFoundError("Không tìm thấy người dùng.")
    return repository.update_profile(user_id, display_name, avatar_url)


def change_password(user_id: str, old_password: str, new_password: str) -> None:
    user = repository.get_by_id(user_id)
    if not user:
        raise NotFoundError("Không tìm thấy người dùng.")
    if not _verify_password(old_password, user["passwordHash"]):
        raise ValidationAppError(
            "Mật khẩu cũ không đúng.",
            details=[{"field": "oldPassword", "message": "Mật khẩu cũ không đúng."}],
        )
    repository.update_password(user_id, _hash_password(new_password))
