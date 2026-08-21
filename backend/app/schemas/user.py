from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from backend.app.models.enums import UserRole


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Full name of user")
    email: EmailStr = Field(..., description="Unique email address")
    flat_no: Optional[str] = Field(None, max_length=50, description="Apartment / Flat number")
    phone_number: Optional[str] = Field(None, max_length=20, description="Contact phone number")


class UserRead(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
