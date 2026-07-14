from typing import Optional

from fastapi import APIRouter, Depends, Query

import service
from auth.dependencies import get_current_user_optional, get_current_user_required
from models import PaginatedPosts, PostCreateRequest, PostResponse, PostUpdateRequest
from schemas.base import SuccessResponse
from schemas.user import CurrentUser
from utils.response import success_response

router = APIRouter(prefix="/posts/blog", tags=["blog"])


@router.get("", response_model=SuccessResponse[PaginatedPosts])
def list_blog(
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
):
    """🌐 PUBLIC + 🔓 OPTIONAL AUTH (adds isOwner per item when a valid token is sent)."""
    items, next_cursor = service.list_public_blog(limit, cursor, search)
    if current_user:
        for item in items:
            item["isOwner"] = item["authorId"] == current_user.userId
    return success_response({"items": items, "nextCursor": next_cursor})


@router.get("/mine", response_model=SuccessResponse[PaginatedPosts])
def list_my_blog(
    limit: int = Query(default=100, ge=1, le=100),
    cursor: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user_required),
):
    """🔒 REQUIRED AUTH - the caller's own blog posts of any status (draft/published), for the admin dashboard."""
    items, next_cursor = service.list_my_blog(current_user.userId, limit, cursor, search, status)
    return success_response({"items": items, "nextCursor": next_cursor})


@router.get("/{post_id}", response_model=SuccessResponse[PostResponse])
def get_blog(post_id: str, current_user: Optional[CurrentUser] = Depends(get_current_user_optional)):
    """🌐 PUBLIC + 🔓 OPTIONAL AUTH (adds isOwner when the caller is the author)."""
    post = service.get_public_blog(post_id, current_user.userId if current_user else None)
    return success_response(post)


@router.post("", response_model=SuccessResponse[PostResponse])
def create_blog(body: PostCreateRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    post = service.create_blog(current_user.userId, body)
    return success_response(post, "Tạo bài viết thành công.")


@router.put("/{post_id}", response_model=SuccessResponse[PostResponse])
def update_blog(post_id: str, body: PostUpdateRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    post = service.update_blog(post_id, current_user.userId, body)
    return success_response(post, "Cập nhật bài viết thành công.")


@router.delete("/{post_id}")
def delete_blog(post_id: str, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒+OWNER"""
    service.delete_blog(post_id, current_user.userId)
    return success_response(None, "Xoá bài viết thành công.")
