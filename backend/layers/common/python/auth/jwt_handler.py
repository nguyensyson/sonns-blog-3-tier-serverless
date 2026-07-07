import json
import time

import boto3
import jwt

from config import settings

_cached_secret: str | None = None
_secrets_client = None


def _get_secret_value() -> str:
    """Resolves the JWT signing secret. In Lambda this reads the Secrets
    Manager secret already wired up by terraform (SECRET_NAME/SECRET_ARN env
    vars); locally it falls back to the JWT_SECRET env var so `uvicorn
    main:app` works without AWS credentials. Cached for the lifetime of the
    execution environment - Secrets Manager is not called on every request."""
    global _cached_secret, _secrets_client
    if _cached_secret:
        return _cached_secret

    secret_id = settings.jwt_secret_arn or settings.jwt_secret_name
    if not secret_id:
        _cached_secret = settings.jwt_secret_fallback
        return _cached_secret

    if _secrets_client is None:
        _secrets_client = boto3.client("secretsmanager", region_name=settings.aws_region)

    response = _secrets_client.get_secret_value(SecretId=secret_id)
    raw = response["SecretString"]
    try:
        parsed = json.loads(raw)
        _cached_secret = parsed.get(settings.jwt_secret_json_key) or raw
    except (json.JSONDecodeError, TypeError):
        _cached_secret = raw
    return _cached_secret


def _create_token(user_id: str, email: str, token_type: str, ttl_seconds: int) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "type": token_type,
        "iat": now,
        "exp": now + ttl_seconds,
    }
    return jwt.encode(payload, _get_secret_value(), algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, email: str) -> str:
    return _create_token(user_id, email, "access", settings.access_token_ttl_minutes * 60)


def create_refresh_token(user_id: str, email: str) -> str:
    return _create_token(user_id, email, "refresh", settings.refresh_token_ttl_days * 24 * 3600)


def decode_token(token: str, expected_type: str = "access") -> dict:
    """Raises jwt.PyJWTError (or a subclass) on any invalid/expired/wrong-type
    token - callers (the auth dependencies) are expected to catch that."""
    payload = jwt.decode(token, _get_secret_value(), algorithms=[settings.jwt_algorithm])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Unexpected token type")
    return payload
