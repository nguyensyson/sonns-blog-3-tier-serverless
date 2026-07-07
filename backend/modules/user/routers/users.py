from fastapi import APIRouter, Depends

import service
from auth.dependencies import get_current_user_required
from models import ChangePasswordRequest, UpdateProfileRequest, UserProfile
from schemas.base import SuccessResponse
from schemas.user import CurrentUser
from utils.response import success_response

router = APIRouter(prefix="/users", tags=["users"])


def _to_profile(user: dict) -> UserProfile:
    return UserProfile(
        userId=user["userId"],
        email=user["email"],
        displayName=user["displayName"],
        avatarUrl=user.get("avatarUrl"),
        createdAt=user["createdAt"],
        updatedAt=user["updatedAt"],
    )


@router.get("/me", response_model=SuccessResponse[UserProfile])
def get_me(current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    user = service.get_profile(current_user.userId)
    return success_response(_to_profile(user))


@router.put("/me", response_model=SuccessResponse[UserProfile])
def update_me(body: UpdateProfileRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    user = service.update_profile(current_user.userId, body.displayName, body.avatarUrl)
    return success_response(_to_profile(user), "Cập nhật hồ sơ thành công.")


@router.put("/me/password")
def change_password(body: ChangePasswordRequest, current_user: CurrentUser = Depends(get_current_user_required)):
    """🔒 REQUIRED AUTH"""
    service.change_password(current_user.userId, body.oldPassword, body.newPassword)
    return success_response(None, "Đổi mật khẩu thành công.")
