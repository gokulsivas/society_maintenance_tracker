from typing import Dict, List
from pydantic import BaseModel, Field
from backend.app.schemas.complaint import ComplaintRead, ComplaintStatusHistoryRead


class DashboardResponse(BaseModel):
    total_complaints: int = Field(..., description="Total number of complaints matching the date filter")
    total_open: int = Field(..., description="Count of complaints with OPEN status")
    total_in_progress: int = Field(..., description="Count of complaints with IN_PROGRESS status")
    total_resolved: int = Field(..., description="Count of complaints with RESOLVED status")
    total_overdue: int = Field(..., description="Count of non-resolved complaints exceeding the configured threshold")
    by_status: Dict[str, int] = Field(..., description="Breakdown of complaints count by status")
    by_category: Dict[str, int] = Field(..., description="Breakdown of complaints count by category")
    by_priority: Dict[str, int] = Field(..., description="Breakdown of complaints count by priority")
    recent_complaints: List[ComplaintRead] = Field(..., description="Bounded list of recent complaints")
    recent_status_transitions: List[ComplaintStatusHistoryRead] = Field(
        ..., description="Bounded list of recent status transition events"
    )
