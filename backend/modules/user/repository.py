from datetime import datetime, timezone
from typing import Optional
import uuid

from boto3.dynamodb.conditions import Key

from db.tables import users_table


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_by_id(user_id: str) -> Optional[dict]:
    return users_table().get_item(Key={"userId": user_id}).get("Item")


def get_by_email(email: str) -> Optional[dict]:
    response = users_table().query(
        IndexName="email-index",
        KeyConditionExpression=Key("email").eq(email),
        Limit=1,
    )
    items = response.get("Items", [])
    return items[0] if items else None


def create(email: str, password_hash: str, display_name: str) -> dict:
    now = _now()
    item = {
        "userId": str(uuid.uuid4()),
        "email": email,
        "passwordHash": password_hash,
        "displayName": display_name,
        "avatarUrl": None,
        "createdAt": now,
        "updatedAt": now,
    }
    users_table().put_item(Item=item)
    return item


def update_profile(user_id: str, display_name: str, avatar_url: Optional[str]) -> dict:
    users_table().update_item(
        Key={"userId": user_id},
        UpdateExpression="SET displayName = :d, avatarUrl = :a, updatedAt = :u",
        ExpressionAttributeValues={":d": display_name, ":a": avatar_url, ":u": _now()},
    )
    return get_by_id(user_id)


def update_password(user_id: str, password_hash: str) -> None:
    users_table().update_item(
        Key={"userId": user_id},
        UpdateExpression="SET passwordHash = :p, updatedAt = :u",
        ExpressionAttributeValues={":p": password_hash, ":u": _now()},
    )
