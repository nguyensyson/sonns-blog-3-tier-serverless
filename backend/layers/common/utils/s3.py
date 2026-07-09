import uuid

import boto3

from config import settings

_s3_client = None

_EXT_BY_CONTENT_TYPE = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


def _client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3", region_name=settings.aws_region)
    return _s3_client


def build_public_url(key: str) -> str:
    if settings.images_bucket_public_base_url:
        return f"{settings.images_bucket_public_base_url.rstrip('/')}/{key}"
    return f"https://{settings.images_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"


def upload_bytes(content: bytes, content_type: str, key_prefix: str = "posts", ext: str = None) -> str:
    """Uploads raw bytes to the images bucket and returns the public URL to
    store in place of a {{imageN.ext}} placeholder. `ext` overrides the
    content-type-derived extension (used for non-image resource files, whose
    extension is taken from the original filename instead)."""
    ext = ext or _EXT_BY_CONTENT_TYPE.get(content_type, ".bin")
    key = f"{key_prefix}/{uuid.uuid4().hex}{ext}"
    _client().put_object(Bucket=settings.images_bucket_name, Key=key, Body=content, ContentType=content_type)
    return build_public_url(key)


def generate_presigned_put_url(key: str, content_type: str, expires_in: int = 300) -> str:
    """Generates a presigned PUT URL so a client can upload directly to S3
    without routing the file bytes through a Lambda. Not wired to an endpoint
    yet (the spec calls for a multipart upload-image endpoint instead) but
    kept in the shared layer since both modules may want it later (e.g. for
    the user avatarUrl upload)."""
    return _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.images_bucket_name, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )
