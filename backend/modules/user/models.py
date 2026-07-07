from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    displayName: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refreshToken: str


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"


class UserProfile(BaseModel):
    userId: str
    email: str
    displayName: str
    avatarUrl: Optional[str] = None
    createdAt: str
    updatedAt: str


class UpdateProfileRequest(BaseModel):
    displayName: str = Field(min_length=1, max_length=100)
    avatarUrl: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str = Field(min_length=6, max_length=128)
