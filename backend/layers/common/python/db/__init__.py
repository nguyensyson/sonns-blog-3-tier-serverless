import boto3
from config import settings

_resource = None


def get_dynamodb_resource():
    """Lazily creates a single boto3 DynamoDB resource shared by every table
    helper in this process (Lambda execution environments are reused across
    invocations, so this avoids reconnecting on every request)."""
    global _resource
    if _resource is None:
        _resource = boto3.resource("dynamodb", region_name=settings.aws_region)
    return _resource
