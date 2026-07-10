from typing import List

from fastapi import APIRouter, Depends

import service
from auth.dependencies import get_current_user_required
from models import GroupCreateRequest, GroupReorderRequest, GroupRenameRequest, GroupResponse, TaskCreateRequest, TaskResponse
from schemas.base import SuccessResponse
from schemas.user import CurrentUser
from utils.response import success_response

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=SuccessResponse[List[GroupResponse]])
def list_groups(current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    groups = service.list_groups_with_tasks(current_user.userId)
    return success_response(groups)


@router.post("", response_model=SuccessResponse[GroupResponse])
def create_group(body: GroupCreateRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    group = service.create_group(current_user.userId, body.name, body.description, body.coverImageUrl)
    return success_response(group, "Tạo group thành công.")


# Registered before the "/{group_id}" routes below - both are PUT on a
# single extra path segment, and FastAPI/Starlette matches routes in
# registration order, so "/reorder" must win over "/{group_id}" matching
# group_id="reorder".
@router.put("/reorder", response_model=SuccessResponse[List[GroupResponse]])
def reorder_groups(body: GroupReorderRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    groups = service.reorder_groups(current_user.userId, body.orderedGroupIds)
    return success_response(groups, "Cập nhật thứ tự group thành công.")


@router.put("/{group_id}", response_model=SuccessResponse[GroupResponse])
def rename_group(group_id: str, body: GroupRenameRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    group = service.rename_group(group_id, current_user.userId, body.name)
    return success_response(group, "Cập nhật group thành công.")


@router.delete("/{group_id}")
def delete_group(group_id: str, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    service.delete_group(group_id, current_user.userId)
    return success_response(None, "Xoá group thành công.")


@router.post("/{group_id}/tasks", response_model=SuccessResponse[TaskResponse])
def create_task(group_id: str, body: TaskCreateRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    task = service.create_task(group_id, current_user.userId, body.title, body.description, body.dueDate)
    return success_response(task, "Tạo task thành công.")
