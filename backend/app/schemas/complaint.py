from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from backend.app.core.cloudinary import is_valid_cloudinary_url
from backend.app.models.enums import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)


class ComplaintCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Complaint title")
    category: ComplaintCategory = Field(..., description="Category of the complaint")
    description: str = Field(..., min_length=5, description="Detailed complaint description")
    photo_url: Optional[str] = Field(None, max_length=500, description="Optional photo URL (Cloudinary)")

    @field_validator("photo_url")
    @classmethod
    def validate_cloudinary_photo_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if not is_valid_cloudinary_url(v):
                raise ValueError(
                    "photo_url must be a valid HTTPS Cloudinary delivery URL (https://res.cloudinary.com/...)"
                )
        return v


class ComplaintUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255, description="Optional updated complaint title")
    category: Optional[ComplaintCategory] = Field(None, description="Optional updated complaint category")
    description: Optional[str] = Field(None, min_length=5, description="Optional updated complaint description")
    photo_url: Optional[str] = Field(None, max_length=500, description="Optional updated photo URL (Cloudinary)")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("title must be at least 2 characters")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 5:
                raise ValueError("description must be at least 5 characters")
        return v

    @field_validator("photo_url")
    @classmethod
    def validate_cloudinary_photo_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if not is_valid_cloudinary_url(v):
                raise ValueError(
                    "photo_url must be a valid HTTPS Cloudinary delivery URL (https://res.cloudinary.com/...)"
                )
        return v

    @model_validator(mode="after")
    def validate_at_least_one_field(self) -> "ComplaintUpdateRequest":
        provided_fields = [
            self.title,
            self.category,
            self.description,
            self.photo_url,
        ]
        if not any(f is not None for f in provided_fields):
            raise ValueError("At least one editable field must be provided for update.")
        return self


class ComplaintPriorityUpdateRequest(BaseModel):
    priority: ComplaintPriority = Field(..., description="Updated priority (LOW, MEDIUM, HIGH)")


class ComplaintStatusUpdateRequest(BaseModel):
    status: ComplaintStatus = Field(..., description="Target status (OPEN, IN_PROGRESS, RESOLVED)")
    note: Optional[str] = Field(None, max_length=1000, description="Optional note or comment for this status change")


class ComplaintStatusHistoryRead(BaseModel):
    id: int
    complaint_id: int
    from_status: Optional[ComplaintStatus] = None
    to_status: ComplaintStatus
    note: Optional[str] = None
    changed_by: Optional[int] = None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintRead(BaseModel):
    id: int
    title: str
    description: str
    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus
    photo_url: Optional[str] = None
    resident_id: int
    resident_name: Optional[str] = None
    resident_flat_no: Optional[str] = None
    is_overdue: bool = False
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintDetailRead(ComplaintRead):
    status_history: List[ComplaintStatusHistoryRead] = []


class PaginatedComplaintsResponse(BaseModel):
    items: List[ComplaintRead]
    total: int
    page: int
    page_size: int
    total_pages: int
