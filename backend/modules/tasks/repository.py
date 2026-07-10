import uuid
from datetime import datetime, timezone
from typing import Optional

from boto3.dynamodb.conditions import Key

from db.tables import groups_table, tasks_table


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# --- Groups ---


def get_group(group_id: str) -> Optional[dict]:
    return groups_table().get_item(Key={"groupId": group_id}).get("Item")


def list_groups_by_user(user_id: str) -> list[dict]:
    response = groups_table().query(
        IndexName="userId-order-index",
        KeyConditionExpression=Key("userId").eq(user_id),
        ScanIndexForward=True,
    )
    return response.get("Items", [])


def create_group(user_id: str, name: str, order: int, description: Optional[str] = None, cover_image_url: Optional[str] = None) -> dict:
    now = _now()
    item = {
        "groupId": str(uuid.uuid4()),
        "userId": user_id,
        "name": name,
        "description": description,
        "coverImageUrl": cover_image_url,
        "order": order,
        "createdAt": now,
        "updatedAt": now,
    }
    groups_table().put_item(Item=item)
    return item


def rename_group(group_id: str, name: str) -> dict:
    groups_table().update_item(
        Key={"groupId": group_id},
        UpdateExpression="SET #n = :n, updatedAt = :u",
        ExpressionAttributeNames={"#n": "name"},
        ExpressionAttributeValues={":n": name, ":u": _now()},
    )
    return get_group(group_id)


def reorder_group(group_id: str, order: int) -> None:
    groups_table().update_item(
        Key={"groupId": group_id},
        UpdateExpression="SET #o = :o, updatedAt = :u",
        ExpressionAttributeNames={"#o": "order"},
        ExpressionAttributeValues={":o": order, ":u": _now()},
    )


def delete_group(group_id: str) -> None:
    groups_table().delete_item(Key={"groupId": group_id})


# --- Tasks ---
# `isDone` is stored as a Number (0/1), not a native DynamoDB Boolean, because
# it is also the sort key of the userId-isDone-index GSI and DynamoDB key
# attributes only support S/N/B types. The tasks service layer converts it
# to/from a Python bool at the API boundary.


def get_task(task_id: str) -> Optional[dict]:
    return tasks_table().get_item(Key={"taskId": task_id}).get("Item")


def list_tasks_by_group(group_id: str) -> list[dict]:
    response = tasks_table().query(
        IndexName="groupId-order-index",
        KeyConditionExpression=Key("groupId").eq(group_id),
        ScanIndexForward=True,
    )
    return response.get("Items", [])


def list_completed_tasks_by_user(user_id: str) -> list[dict]:
    response = tasks_table().query(
        IndexName="userId-isDone-index",
        KeyConditionExpression=Key("userId").eq(user_id) & Key("isDone").eq(1),
    )
    return response.get("Items", [])


def create_task(user_id: str, group_id: str, title: str, description: Optional[str], due_date: Optional[str], order: int) -> dict:
    now = _now()
    item = {
        "taskId": str(uuid.uuid4()),
        "groupId": group_id,
        "userId": user_id,
        "title": title,
        "description": description or "",
        "dueDate": due_date,
        "isDone": 0,
        "completedAt": None,
        "order": order,
        "createdAt": now,
        "updatedAt": now,
    }
    tasks_table().put_item(Item=item)
    return item


def update_task(task_id: str, title: str, description: Optional[str], due_date: Optional[str]) -> dict:
    tasks_table().update_item(
        Key={"taskId": task_id},
        UpdateExpression="SET title = :t, description = :d, dueDate = :dd, updatedAt = :u",
        ExpressionAttributeValues={":t": title, ":d": description or "", ":dd": due_date, ":u": _now()},
    )
    return get_task(task_id)


def move_task(task_id: str, group_id: str, order: int) -> dict:
    tasks_table().update_item(
        Key={"taskId": task_id},
        UpdateExpression="SET groupId = :g, #o = :o, updatedAt = :u",
        ExpressionAttributeNames={"#o": "order"},
        ExpressionAttributeValues={":g": group_id, ":o": order, ":u": _now()},
    )
    return get_task(task_id)


def set_done(task_id: str, is_done: bool, completed_at: Optional[str]) -> dict:
    tasks_table().update_item(
        Key={"taskId": task_id},
        UpdateExpression="SET isDone = :i, completedAt = :c, updatedAt = :u",
        ExpressionAttributeValues={":i": 1 if is_done else 0, ":c": completed_at, ":u": _now()},
    )
    return get_task(task_id)


def delete_task(task_id: str) -> None:
    tasks_table().delete_item(Key={"taskId": task_id})


def delete_tasks_by_group(group_id: str) -> None:
    for task in list_tasks_by_group(group_id):
        delete_task(task["taskId"])


def count_active_tasks_in_group(group_id: str) -> int:
    return len([t for t in list_tasks_by_group(group_id) if not t.get("isDone")])
