from fastapi import APIRouter

import service
from models import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from schemas.base import SuccessResponse
from utils.response import success_response

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=SuccessResponse[TokenResponse])
def register(body: RegisterRequest):
    """🌐 PUBLIC"""
    tokens = service.register(body.email, body.password, body.displayName)
    return success_response(TokenResponse(**tokens), "Đăng ký thành công.")


@router.post("/login", response_model=SuccessResponse[TokenResponse])
def login(body: LoginRequest):
    """🌐 PUBLIC"""
    tokens = service.login(body.email, body.password)
    return success_response(TokenResponse(**tokens), "Đăng nhập thành công.")


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
def refresh(body: RefreshRequest):
    """🌐 PUBLIC"""
    tokens = service.refresh(body.refreshToken)
    return success_response(TokenResponse(**tokens), "Làm mới token thành công.")
