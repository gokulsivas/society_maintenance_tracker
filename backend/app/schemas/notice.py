from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NoticeCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Notice title")
    body: str = Field(..., min_length=5, description="Notice body text")
    is_important: bool = Field(False, description="Whether this notice is marked important / pinned")


class NoticeUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255, description="Updated notice title")
    body: Optional[str] = Field(None, min_length=5, description="Updated notice body text")
    is_important: Optional[bool] = Field(None, description="Updated importance flag")


class NoticeRead(BaseModel):
    id: int
    title: str
    body: str
    is_important: bool
    posted_by: Optional[int] = None
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedNoticesResponse(BaseModel):
    items: List[NoticeRead]
    total: int
    page: int
    page_size: int
    total_pages: int
