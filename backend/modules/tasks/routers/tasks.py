from fastapi import APIRouter, Depends

import service
from auth.dependencies import get_current_user_required
from models import TaskMoveRequest, TaskResponse, TaskUpdateRequest
from schemas.base import SuccessResponse
from schemas.user import CurrentUser
from utils.response import success_response

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.put("/{task_id}", response_model=SuccessResponse[TaskResponse])
def update_task(task_id: str, body: TaskUpdateRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    task = service.update_task(task_id, current_user.userId, body.title, body.description, body.dueDate)
    return success_response(task, "Cập nhật task thành công.")


@router.put("/{task_id}/move", response_model=SuccessResponse[TaskResponse])
def move_task(task_id: str, body: TaskMoveRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    task = service.move_task(task_id, current_user.userId, body.groupId, body.order)
    return success_response(task, "Di chuyển task thành công.")


@router.put("/{task_id}/complete", response_model=SuccessResponse[TaskResponse])
def complete_task(task_id: str, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    task = service.complete_task(task_id, current_user.userId)
    return success_response(task, "Đánh dấu hoàn thành task thành công.")


@router.put("/{task_id}/reopen", response_model=SuccessResponse[TaskResponse])
def reopen_task(task_id: str, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    task = service.reopen_task(task_id, current_user.userId)
    return success_response(task, "Mở lại task thành công.")


@router.delete("/{task_id}")
def delete_task(task_id: str, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    service.delete_task(task_id, current_user.userId)
    return success_response(None, "Xoá task thành công.")
