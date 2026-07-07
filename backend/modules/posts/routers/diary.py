from typing import Optional

from fastapi import APIRouter, Depends, Query

import service
from auth.dependencies import get_current_user_required
from models import PaginatedPosts, PostCreateRequest, PostResponse, PostUpdateRequest
from schemas.base import SuccessResponse
from schemas.user import CurrentUser
from utils.response import success_response

# Endpoint paths follow the spec's "/posts/diary" naming; the value stored in
# the `category` attribute is "journal" to match the existing frontend
# (BlogContext.jsx / JournalPage.jsx already use category: 'journal').
router = APIRouter(prefix="/posts/diary", tags=["diary"])


@router.get("", response_model=SuccessResponse[PaginatedPosts])
def list_diary(
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user_required),
):
    """🔒 REQUIRED AUTH - only the caller's own entries, never another user's."""
    items, next_cursor = service.list_my_journal(current_user.userId, limit, cursor)
    return success_response({"items": items, "nextCursor": next_cursor})


@router.get("/{post_id}", response_model=SuccessResponse[PostResponse])
def get_diary(post_id: str, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    entry = service.get_my_journal_entry(post_id, current_user.userId)
    return success_response(entry)


@router.post("", response_model=SuccessResponse[PostResponse])
def create_diary(body: PostCreateRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    entry = service.create_journal(current_user.userId, body)
    return success_response(entry, "Tạo nhật ký thành công.")


@router.put("/{post_id}", response_model=SuccessResponse[PostResponse])
def update_diary(post_id: str, body: PostUpdateRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    entry = service.update_journal(post_id, current_user.userId, body)
    return success_response(entry, "Cập nhật nhật ký thành công.")


@router.delete("/{post_id}")
def delete_diary(post_id: str, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    service.delete_journal(post_id, current_user.userId)
    return success_response(None, "Xoá nhật ký thành công.")
