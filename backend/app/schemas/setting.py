from pydantic import BaseModel, Field


class OverdueThresholdResponse(BaseModel):
    overdue_threshold_days: int = Field(..., description="Number of days after which an open/in-progress complaint is overdue")


class OverdueThresholdUpdateRequest(BaseModel):
    overdue_threshold_days: int = Field(
        ...,
        ge=1,
        le=365,
        description="Updated overdue threshold in days (must be between 1 and 365)",
    )
