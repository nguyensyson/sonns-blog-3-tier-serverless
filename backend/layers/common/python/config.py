import os


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    """Central place to read environment variables shared by every Lambda module.

    Table/bucket/secret names default to the identifiers already provisioned in
    terraform/environments/*/main.tf (DYNAMODB_TABLE_NAME, IMAGES_BUCKET_NAME,
    SECRET_NAME, SECRET_ARN) where a matching env var exists; new per-entity
    table names are added on top since the current Terraform only provisions a
    single generic table (see backend/README.md "Terraform gap" section).
    """

    aws_region: str = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "ap-southeast-1"))
    environment: str = os.environ.get("ENVIRONMENT", "dev")

    users_table_name: str = os.environ.get("USERS_TABLE_NAME", "Users")
    posts_table_name: str = os.environ.get("POSTS_TABLE_NAME", "Posts")
    groups_table_name: str = os.environ.get("GROUPS_TABLE_NAME", "Groups")
    tasks_table_name: str = os.environ.get("TASKS_TABLE_NAME", "Tasks")

    images_bucket_name: str = os.environ.get("IMAGES_BUCKET_NAME", "")
    images_bucket_public_base_url: str = os.environ.get("IMAGES_BUCKET_PUBLIC_BASE_URL", "")

    # Reuses the same Secrets Manager secret already wired up by the
    # terraform lambda/iam modules (env vars SECRET_NAME / SECRET_ARN).
    jwt_secret_name: str = os.environ.get("SECRET_NAME", "")
    jwt_secret_arn: str = os.environ.get("SECRET_ARN", "")
    jwt_secret_json_key: str = os.environ.get("JWT_SECRET_JSON_KEY", "jwt_secret")
    # Local-dev-only fallback so `uvicorn main:app` works without AWS credentials.
    jwt_secret_fallback: str = os.environ.get("JWT_SECRET", "dev-only-insecure-secret-change-me")
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = int(os.environ.get("ACCESS_TOKEN_TTL_MINUTES", "30"))
    refresh_token_ttl_days: int = int(os.environ.get("REFRESH_TOKEN_TTL_DAYS", "7"))

    cors_allow_origins: list[str] = _split_csv(os.environ.get("CORS_ALLOW_ORIGINS", "*"))

    log_level: str = os.environ.get("LOG_LEVEL", "INFO")


settings = Settings()
