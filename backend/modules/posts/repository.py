import base64
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from boto3.dynamodb.conditions import Attr, Key

from db.tables import posts_table


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _encode_cursor(key: Optional[dict]) -> Optional[str]:
    if not key:
        return None
    return base64.urlsafe_b64encode(json.dumps(key).encode()).decode()


def _decode_cursor(cursor: Optional[str]) -> Optional[dict]:
    if not cursor:
        return None
    return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())


def get_by_id(post_id: str) -> Optional[dict]:
    return posts_table().get_item(Key={"postId": post_id}).get("Item")


def create(author_id: str, category: str, data: dict) -> dict:
    now = _now()
    item = {
        "postId": str(uuid.uuid4()),
        "authorId": author_id,
        "category": category,
        "createdAt": now,
        "updatedAt": now,
        **data,
    }
    posts_table().put_item(Item=item)
    return item


def update(post_id: str, data: dict) -> dict:
    expr_names = {}
    expr_values = {":u": _now()}
    set_parts = ["updatedAt = :u"]
    for index, (field, value) in enumerate(data.items()):
        name_key, value_key = f"#f{index}", f":v{index}"
        expr_names[name_key] = field
        expr_values[value_key] = value
        set_parts.append(f"{name_key} = {value_key}")
    posts_table().update_item(
        Key={"postId": post_id},
        UpdateExpression="SET " + ", ".join(set_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return get_by_id(post_id)


def delete(post_id: str) -> None:
    posts_table().delete_item(Key={"postId": post_id})


def list_by_category(category: str, limit: int, cursor: Optional[str], only_published: bool = False):
    kwargs = {
        "IndexName": "category-createdAt-index",
        "KeyConditionExpression": Key("category").eq(category),
        "ScanIndexForward": False,
        "Limit": limit,
    }
    if only_published:
        kwargs["FilterExpression"] = Attr("status").eq("published")
    start_key = _decode_cursor(cursor)
    if start_key:
        kwargs["ExclusiveStartKey"] = start_key
    response = posts_table().query(**kwargs)
    return response.get("Items", []), _encode_cursor(response.get("LastEvaluatedKey"))


def list_by_author(author_id: str, limit: int, cursor: Optional[str], category: Optional[str] = None):
    kwargs = {
        "IndexName": "authorId-createdAt-index",
        "KeyConditionExpression": Key("authorId").eq(author_id),
        "ScanIndexForward": False,
        "Limit": limit,
    }
    if category:
        kwargs["FilterExpression"] = Attr("category").eq(category)
    start_key = _decode_cursor(cursor)
    if start_key:
        kwargs["ExclusiveStartKey"] = start_key
    response = posts_table().query(**kwargs)
    return response.get("Items", []), _encode_cursor(response.get("LastEvaluatedKey"))
