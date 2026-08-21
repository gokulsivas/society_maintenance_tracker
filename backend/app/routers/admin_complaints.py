import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, and_, not_, case

from backend.app.core.database import get_db
from backend.app.core.dependencies import require_admin
from backend.app.core.email import send_complaint_status_email
from backend.app.models.enums import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)
from backend.app.models.user import User
from backend.app.models.complaint import Complaint, ComplaintStatusHistory
from backend.app.routers.complaints import (
    get_overdue_threshold_days,
    is_complaint_overdue,
    map_complaint_read,
)
from backend.app.schemas.complaint import (
    ComplaintPriorityUpdateRequest,
    ComplaintStatusUpdateRequest,
    ComplaintRead,
    ComplaintDetailRead,
    ComplaintStatusHistoryRead,
    PaginatedComplaintsResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_STATUS_TRANSITIONS = {
    ComplaintStatus.OPEN: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED},
    ComplaintStatus.IN_PROGRESS: {ComplaintStatus.RESOLVED},
    ComplaintStatus.RESOLVED: set(),
}


@router.get(
    "",
    response_model=PaginatedComplaintsResponse,
    status_code=status.HTTP_200_OK,
    summary="List, filter, and paginate all complaints for administrators",
)
def list_admin_complaints(
    category: Optional[ComplaintCategory] = Query(None, description="Filter by category"),
    status_filter: Optional[ComplaintStatus] = Query(None, alias="status", description="Filter by status"),
    priority: Optional[ComplaintPriority] = Query(None, description="Filter by priority"),
    is_overdue: Optional[bool] = Query(None, description="Filter by live overdue state"),
    start_date: Optional[datetime] = Query(None, description="Filter complaints created on or after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter complaints created on or before this date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedComplaintsResponse:
    """Admin endpoint to list all complaints with multi-criteria filtering, live overdue calculation, and pagination."""
    threshold_days = get_overdue_threshold_days(db)
    now = datetime.now(timezone.utc)
    cutoff_time = now - timedelta(days=threshold_days)

    filters = []

    if category:
        filters.append(Complaint.category == category)
    if status_filter:
        filters.append(Complaint.status == status_filter)
    if priority:
        filters.append(Complaint.priority == priority)
    if start_date:
        filters.append(Complaint.created_at >= start_date)
    if end_date:
        filters.append(Complaint.created_at <= end_date)

    # Live SQL overdue expression
    is_overdue_condition = and_(
        Complaint.status != ComplaintStatus.RESOLVED,
        Complaint.created_at < cutoff_time,
    )

    if is_overdue is True:
        filters.append(is_overdue_condition)
    elif is_overdue is False:
        filters.append(not_(is_overdue_condition))

    # Priority weighting for ordering (HIGH=3, MEDIUM=2, LOW=1)
    priority_order = case(
        (Complaint.priority == ComplaintPriority.HIGH, 3),
        (Complaint.priority == ComplaintPriority.MEDIUM, 2),
        (Complaint.priority == ComplaintPriority.LOW, 1),
        else_=0,
    )

    # Overdue weighting for ordering (Overdue first)
    is_overdue_order = case(
        (is_overdue_condition, 1),
        else_=0,
    )

    # 1. Total Count Query
    count_stmt = select(func.count(Complaint.id))
    if filters:
        count_stmt = count_stmt.where(and_(*filters))
    total_items = db.scalar(count_stmt) or 0

    # 2. Paginated Query with Sorting: Overdue first, Priority DESC, Created At ASC
    query_stmt = (
        select(Complaint)
        .options(joinedload(Complaint.resident))
        .order_by(
            is_overdue_order.desc(),
            priority_order.desc(),
            Complaint.created_at.asc(),
        )
    )
    if filters:
        query_stmt = query_stmt.where(and_(*filters))

    offset = (page - 1) * page_size
    query_stmt = query_stmt.offset(offset).limit(page_size)

    complaints = db.scalars(query_stmt).all()
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1

    return PaginatedComplaintsResponse(
        items=[map_complaint_read(c, threshold_days) for c in complaints],
        total=total_items,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.patch(
    "/{complaint_id}/priority",
    response_model=ComplaintRead,
    status_code=status.HTTP_200_OK,
    summary="Update complaint priority",
)
def update_complaint_priority(
    complaint_id: int,
    payload: ComplaintPriorityUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ComplaintRead:
    """Administrator updates complaint priority (LOW, MEDIUM, HIGH). Does not alter status history."""
    threshold_days = get_overdue_threshold_days(db)

    complaint = db.scalars(
        select(Complaint)
        .options(joinedload(Complaint.resident))
        .where(Complaint.id == complaint_id)
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    complaint.priority = payload.priority
    db.commit()
    db.refresh(complaint)

    return map_complaint_read(complaint, threshold_days)


@router.patch(
    "/{complaint_id}/status",
    response_model=ComplaintDetailRead,
    status_code=status.HTTP_200_OK,
    summary="Update complaint status lifecycle",
)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ComplaintDetailRead:
    """Transition complaint status (OPEN -> IN_PROGRESS -> RESOLVED).

    Inserts a history record in the same transaction and dispatches an email notification post-commit.
    """
    threshold_days = get_overdue_threshold_days(db)

    complaint = db.scalars(
        select(Complaint)
        .options(
            joinedload(Complaint.resident),
            joinedload(Complaint.status_history),
        )
        .where(Complaint.id == complaint_id)
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    current_status = complaint.status
    target_status = payload.status

    # Check if already resolved
    if current_status == ComplaintStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resolved complaints are terminal and cannot be reopened or transitioned",
        )

    # Validate transition
    allowed_targets = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Invalid status transition from {current_status.value} to {target_status.value}",
        )

    # 1. Update status and resolved_at
    complaint.status = target_status
    if target_status == ComplaintStatus.RESOLVED:
        complaint.resolved_at = datetime.now(timezone.utc)

    # 2. Insert history record in the same atomic transaction
    note_text = payload.note.strip() if payload.note else None
    history_record = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=current_status,
        to_status=target_status,
        note=note_text,
        changed_by=current_user.id,
    )
    db.add(history_record)

    # 3. Commit transaction
    db.commit()
    db.refresh(complaint)

    # 4. Post-commit notification (Zero-Rollback Guarantee: errors never roll back DB)
    if complaint.resident and complaint.resident.email:
        try:
            send_complaint_status_email(
                resident_email=complaint.resident.email,
                resident_name=complaint.resident.name,
                complaint_id=complaint.id,
                complaint_title=complaint.title,
                from_status=current_status.value,
                to_status=target_status.value,
                note=note_text,
            )
        except Exception as exc:
            logger.error("Post-commit status email failed: %s", type(exc).__name__)

    sorted_history = sorted(complaint.status_history, key=lambda h: h.changed_at)

    return ComplaintDetailRead(
        id=complaint.id,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        photo_url=complaint.photo_url,
        resident_id=complaint.resident_id,
        resident_name=complaint.resident.name if complaint.resident else None,
        resident_flat_no=complaint.resident.flat_no if complaint.resident else None,
        is_overdue=is_complaint_overdue(complaint.created_at, complaint.status, threshold_days),
        resolved_at=complaint.resolved_at,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        status_history=[ComplaintStatusHistoryRead.model_validate(h) for h in sorted_history],
    )
