from datetime import datetime, timezone
from typing import Optional

import repository
from auth.ownership import assert_owner
from utils.exceptions import NotFoundError


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_task_response(task: dict) -> dict:
    return {**task, "isDone": bool(task.get("isDone"))}


def _get_owned_group(group_id: str, user_id: str) -> dict:
    group = repository.get_group(group_id)
    if not group:
        raise NotFoundError("Không tìm thấy group.")
    assert_owner(group["userId"], user_id, "Bạn không có quyền thao tác trên group này.")
    return group


def _get_owned_task(task_id: str, user_id: str) -> dict:
    # Double-checks userId on the task itself (not just via its current
    # group) so a task keeps the right owner even if groupId were ever
    # updated inconsistently - matches the spec's userId field rationale.
    task = repository.get_task(task_id)
    if not task:
        raise NotFoundError("Không tìm thấy task.")
    assert_owner(task["userId"], user_id, "Bạn không có quyền thao tác trên task này.")
    return task


def list_groups_with_tasks(user_id: str) -> list[dict]:
    groups = repository.list_groups_by_user(user_id)
    result = []
    for group in groups:
        tasks = repository.list_tasks_by_group(group["groupId"])
        result.append({**group, "tasks": [_to_task_response(t) for t in tasks]})
    return result


def create_group(user_id: str, name: str) -> dict:
    existing = repository.list_groups_by_user(user_id)
    group = repository.create_group(user_id, name, order=len(existing))
    return {**group, "tasks": []}


def rename_group(group_id: str, user_id: str, name: str) -> dict:
    _get_owned_group(group_id, user_id)
    updated = repository.rename_group(group_id, name)
    tasks = repository.list_tasks_by_group(group_id)
    return {**updated, "tasks": [_to_task_response(t) for t in tasks]}


def delete_group(group_id: str, user_id: str) -> None:
    _get_owned_group(group_id, user_id)
    repository.delete_tasks_by_group(group_id)
    repository.delete_group(group_id)


def reorder_groups(user_id: str, ordered_group_ids: list[str]) -> list[dict]:
    for index, group_id in enumerate(ordered_group_ids):
        _get_owned_group(group_id, user_id)
        repository.reorder_group(group_id, index)
    return list_groups_with_tasks(user_id)


def create_task(group_id: str, user_id: str, title: str, description: Optional[str], due_date: Optional[str]) -> dict:
    _get_owned_group(group_id, user_id)
    order = repository.count_active_tasks_in_group(group_id)
    task = repository.create_task(user_id, group_id, title, description, due_date, order)
    return _to_task_response(task)


def update_task(task_id: str, user_id: str, title: str, description: Optional[str], due_date: Optional[str]) -> dict:
    _get_owned_task(task_id, user_id)
    updated = repository.update_task(task_id, title, description, due_date)
    return _to_task_response(updated)


def move_task(task_id: str, user_id: str, target_group_id: str, order: int) -> dict:
    _get_owned_task(task_id, user_id)
    _get_owned_group(target_group_id, user_id)
    updated = repository.move_task(task_id, target_group_id, order)
    return _to_task_response(updated)


def complete_task(task_id: str, user_id: str) -> dict:
    _get_owned_task(task_id, user_id)
    updated = repository.set_done(task_id, True, _now())
    return _to_task_response(updated)


def reopen_task(task_id: str, user_id: str) -> dict:
    task = _get_owned_task(task_id, user_id)
    order = repository.count_active_tasks_in_group(task["groupId"])
    repository.set_done(task_id, False, None)
    updated = repository.move_task(task_id, task["groupId"], order)
    return _to_task_response(updated)


def delete_task(task_id: str, user_id: str) -> None:
    _get_owned_task(task_id, user_id)
    repository.delete_task(task_id)
