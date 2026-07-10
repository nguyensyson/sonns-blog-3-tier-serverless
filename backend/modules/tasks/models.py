from typing import List, Optional

from pydantic import BaseModel, Field


class GroupCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=200)
    coverImageUrl: Optional[str] = None


class GroupRenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class GroupReorderRequest(BaseModel):
    orderedGroupIds: List[str]


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default="", max_length=2000)
    dueDate: Optional[str] = None


class TaskUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default="", max_length=2000)
    dueDate: Optional[str] = None


class TaskMoveRequest(BaseModel):
    groupId: str
    order: int = Field(ge=0)


class TaskResponse(BaseModel):
    taskId: str
    groupId: str
    userId: str
    title: str
    description: Optional[str] = ""
    dueDate: Optional[str] = None
    isDone: bool
    completedAt: Optional[str] = None
    order: int
    createdAt: str
    updatedAt: str


class GroupResponse(BaseModel):
    groupId: str
    userId: str
    name: str
    description: Optional[str] = None
    coverImageUrl: Optional[str] = None
    order: int
    createdAt: str
    updatedAt: str
    tasks: List[TaskResponse] = []
