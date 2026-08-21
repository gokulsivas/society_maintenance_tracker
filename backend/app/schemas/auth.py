from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from backend.app.schemas.user import UserRead


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, max_length=128, description="Account password (min 6 characters)")
    flat_no: Optional[str] = Field(None, max_length=50, description="Apartment or Flat number")
    phone_number: Optional[str] = Field(None, max_length=20, description="Phone number")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=1, description="Account password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenPayload(BaseModel):
    sub: str
    exp: Optional[int] = None
    iat: Optional[int] = None
