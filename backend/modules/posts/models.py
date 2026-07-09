from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

ALLOWED_STATUSES = {"draft", "published"}


class PostCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    tag: str = Field(default="", max_length=50)
    excerpt: str = Field(min_length=1, max_length=500)
    content: str = Field(default="")
    images: Dict[str, str] = Field(default_factory=dict)
    coverIndex: int = Field(default=0, ge=0, le=1)
    coverImageUrl: Optional[str] = Field(default=None, max_length=1000)
    resourceUrl: Optional[str] = Field(default=None, max_length=1000)
    resourceName: Optional[str] = Field(default=None, max_length=255)
    # Blog-only (ignored for diary/journal entries).
    status: Optional[str] = Field(default="published")
    # Diary/journal-only free-text display date (e.g. "Sep 2025 — Hiện tại").
    date: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_STATUSES:
            raise ValueError("status phải là 'draft' hoặc 'published'.")
        return value


class PostUpdateRequest(PostCreateRequest):
    pass


class PostResponse(BaseModel):
    postId: str
    authorId: str
    category: str
    title: str
    tag: str
    excerpt: str
    content: str
    images: Dict[str, str]
    coverIndex: int
    coverImageUrl: Optional[str] = None
    resourceUrl: Optional[str] = None
    resourceName: Optional[str] = None
    status: Optional[str] = None
    date: Optional[str] = None
    readTime: str
    createdAt: str
    updatedAt: str
    isOwner: Optional[bool] = None


class PaginatedPosts(BaseModel):
    items: List[PostResponse]
    nextCursor: Optional[str] = None


class UploadImageResponse(BaseModel):
    url: str


class UploadResourceResponse(BaseModel):
    url: str
    name: str
