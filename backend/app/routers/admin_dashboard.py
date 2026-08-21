from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, and_

from backend.app.core.database import get_db
from backend.app.core.dependencies import require_admin
from backend.app.models.enums import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)
from backend.app.models.user import User
from backend.app.models.complaint import Complaint, ComplaintStatusHistory
from backend.app.models.setting import Setting
from backend.app.routers.complaints import (
    get_overdue_threshold_days,
    map_complaint_read,
)
from backend.app.schemas.complaint import ComplaintStatusHistoryRead
from backend.app.schemas.dashboard import DashboardResponse
from backend.app.schemas.setting import (
    OverdueThresholdResponse,
    OverdueThresholdUpdateRequest,
)

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin dashboard summary and reporting statistics",
)
def get_admin_dashboard(
    from_date: Optional[datetime] = Query(
        None,
        description="Filter complaints created on or after this timestamp (inclusive: created_at >= from_date)",
    ),
    to_date: Optional[datetime] = Query(
        None,
        description="Filter complaints created on or before this timestamp (inclusive: created_at <= to_date)",
    ),
    recent_limit: int = Query(
        5,
        ge=1,
        le=50,
        description="Maximum number of recent complaints and status transitions to return (1-50)",
    ),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> DashboardResponse:
    """Retrieve aggregated reporting statistics, status/category/priority breakdowns, live overdue totals, and recent activity."""
    # 1. Validate date-range boundaries
    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date cannot be after to_date.",
        )

    # 2. Build date boundary filters (inclusive)
    date_filters = []
    if from_date:
        date_filters.append(Complaint.created_at >= from_date)
    if to_date:
        date_filters.append(Complaint.created_at <= to_date)

    # 3. Read live overdue threshold setting
    threshold_days = get_overdue_threshold_days(db)
    now = datetime.now(timezone.utc)
    cutoff_time = now - timedelta(days=threshold_days)

    # 4. Status Counts SQL Aggregation
    status_counts_map: Dict[str, int] = {s.value: 0 for s in ComplaintStatus}
    status_query = select(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status)
    if date_filters:
        status_query = status_query.where(and_(*date_filters))
    for s_enum, cnt in db.execute(status_query).all():
        s_val = s_enum.value if hasattr(s_enum, "value") else str(s_enum)
        status_counts_map[s_val] = cnt

    # 5. Category Counts SQL Aggregation
    category_counts_map: Dict[str, int] = {c.value: 0 for c in ComplaintCategory}
    category_query = select(Complaint.category, func.count(Complaint.id)).group_by(Complaint.category)
    if date_filters:
        category_query = category_query.where(and_(*date_filters))
    for c_enum, cnt in db.execute(category_query).all():
        c_val = c_enum.value if hasattr(c_enum, "value") else str(c_enum)
        category_counts_map[c_val] = cnt

    # 6. Priority Counts SQL Aggregation
    priority_counts_map: Dict[str, int] = {p.value: 0 for p in ComplaintPriority}
    priority_query = select(Complaint.priority, func.count(Complaint.id)).group_by(Complaint.priority)
    if date_filters:
        priority_query = priority_query.where(and_(*date_filters))
    for p_enum, cnt in db.execute(priority_query).all():
        p_val = p_enum.value if hasattr(p_enum, "value") else str(p_enum)
        priority_counts_map[p_val] = cnt

    # 7. Total Complaints Count
    total_complaints = sum(status_counts_map.values())
    total_open = status_counts_map.get(ComplaintStatus.OPEN.value, 0)
    total_in_progress = status_counts_map.get(ComplaintStatus.IN_PROGRESS.value, 0)
    total_resolved = status_counts_map.get(ComplaintStatus.RESOLVED.value, 0)

    # 8. Live Overdue Count SQL Aggregation
    overdue_query = select(func.count(Complaint.id)).where(
        Complaint.status != ComplaintStatus.RESOLVED,
        Complaint.created_at < cutoff_time,
    )
    if date_filters:
        overdue_query = overdue_query.where(and_(*date_filters))
    total_overdue = db.scalar(overdue_query) or 0

    # 9. Recent Complaints (bounded by recent_limit, ordered created_at DESC)
    recent_complaints_query = (
        select(Complaint)
        .options(joinedload(Complaint.resident))
        .order_by(Complaint.created_at.desc())
        .limit(recent_limit)
    )
    if date_filters:
        recent_complaints_query = recent_complaints_query.where(and_(*date_filters))
    recent_complaints_orm = db.scalars(recent_complaints_query).all()
    recent_complaints = [map_complaint_read(c, threshold_days) for c in recent_complaints_orm]

    # 10. Recent Status Transitions (bounded by recent_limit, ordered changed_at DESC)
    recent_history_query = (
        select(ComplaintStatusHistory)
        .order_by(ComplaintStatusHistory.changed_at.desc())
        .limit(recent_limit)
    )
    recent_history_orm = db.scalars(recent_history_query).all()
    recent_status_transitions = [
        ComplaintStatusHistoryRead.model_validate(h) for h in recent_history_orm
    ]

    return DashboardResponse(
        total_complaints=total_complaints,
        total_open=total_open,
        total_in_progress=total_in_progress,
        total_resolved=total_resolved,
        total_overdue=total_overdue,
        by_status=status_counts_map,
        by_category=category_counts_map,
        by_priority=priority_counts_map,
        recent_complaints=recent_complaints,
        recent_status_transitions=recent_status_transitions,
    )


@router.get(
    "/settings/overdue-threshold",
    response_model=OverdueThresholdResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current overdue threshold setting in days (Admin only)",
)
def get_overdue_threshold_setting(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OverdueThresholdResponse:
    """Retrieve the configured overdue threshold in days."""
    threshold = get_overdue_threshold_days(db)
    return OverdueThresholdResponse(overdue_threshold_days=threshold)


@router.patch(
    "/settings/overdue-threshold",
    response_model=OverdueThresholdResponse,
    status_code=status.HTTP_200_OK,
    summary="Update overdue threshold setting in days (Admin only)",
)
def update_overdue_threshold_setting(
    payload: OverdueThresholdUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OverdueThresholdResponse:
    """Update the overdue threshold in days (valid range: 1 to 365 days)."""
    setting = db.scalars(
        select(Setting).where(Setting.key == "overdue_threshold_days")
    ).first()

    if setting:
        setting.value = str(payload.overdue_threshold_days)
    else:
        setting = Setting(
            key="overdue_threshold_days",
            value=str(payload.overdue_threshold_days),
            description="Threshold in days for overdue complaints",
        )
        db.add(setting)

    db.commit()

    return OverdueThresholdResponse(overdue_threshold_days=payload.overdue_threshold_days)
