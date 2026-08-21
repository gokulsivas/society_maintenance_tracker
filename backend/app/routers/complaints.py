from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_resident
from backend.app.models.enums import ComplaintStatus, ComplaintPriority, UserRole
from backend.app.models.user import User
from backend.app.models.complaint import Complaint, ComplaintStatusHistory
from backend.app.models.setting import Setting
from backend.app.schemas.complaint import (
    ComplaintCreateRequest,
    ComplaintUpdateRequest,
    ComplaintRead,
    ComplaintDetailRead,
    ComplaintStatusHistoryRead,
)

router = APIRouter()


def get_overdue_threshold_days(db: Session) -> int:
    """Read the overdue threshold in days from the database settings."""
    setting = db.scalars(
        select(Setting).where(Setting.key == "overdue_threshold_days")
    ).first()
    if setting and setting.value and setting.value.isdigit():
        return int(setting.value)
    return settings.DEFAULT_OVERDUE_THRESHOLD_DAYS


def is_complaint_overdue(created_at: datetime, complaint_status: ComplaintStatus, threshold_days: int) -> bool:
    """Calculate overdue status live based on creation age and resolution status."""
    if complaint_status == ComplaintStatus.RESOLVED:
        return False
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return (now - created_at) > timedelta(days=threshold_days)


def map_complaint_read(complaint: Complaint, threshold_days: int) -> ComplaintRead:
    """Transform a Complaint ORM model into ComplaintRead schema with resident and overdue info."""
    return ComplaintRead(
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
    )


@router.post(
    "",
    response_model=ComplaintRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new complaint",
)
def create_complaint(
    payload: ComplaintCreateRequest,
    current_user: User = Depends(require_resident),
    db: Session = Depends(get_db),
) -> ComplaintRead:
    """Resident raises a new complaint. Initial status is OPEN and priority is MEDIUM."""
    threshold_days = get_overdue_threshold_days(db)

    # 1. Create Complaint instance
    complaint = Complaint(
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category,
        priority=ComplaintPriority.MEDIUM,
        status=ComplaintStatus.OPEN,
        photo_url=payload.photo_url.strip() if payload.photo_url else None,
        resident_id=current_user.id,
    )
    db.add(complaint)
    db.flush()  # Flush to generate complaint.id for history record

    # 2. Insert initial status history in the same transaction
    history_record = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=None,
        to_status=ComplaintStatus.OPEN,
        note="Complaint submitted by resident",
        changed_by=current_user.id,
    )
    db.add(history_record)

    # 3. Commit atomic transaction
    db.commit()
    db.refresh(complaint)

    return map_complaint_read(complaint, threshold_days)


@router.get(
    "/my",
    response_model=List[ComplaintRead],
    status_code=status.HTTP_200_OK,
    summary="List current resident's complaints",
)
def get_my_complaints(
    current_user: User = Depends(require_resident),
    db: Session = Depends(get_db),
) -> List[ComplaintRead]:
    """Retrieve all complaints raised by the current authenticated resident."""
    threshold_days = get_overdue_threshold_days(db)

    stmt = (
        select(Complaint)
        .options(joinedload(Complaint.resident))
        .where(Complaint.resident_id == current_user.id)
        .order_by(Complaint.created_at.desc())
    )
    complaints = db.scalars(stmt).all()

    return [map_complaint_read(c, threshold_days) for c in complaints]


@router.get(
    "/{complaint_id}",
    response_model=ComplaintDetailRead,
    status_code=status.HTTP_200_OK,
    summary="Get complaint details with full status history",
)
def get_complaint_detail(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ComplaintDetailRead:
    """Retrieve complaint details. Residents can view only their own complaints; Admins can view any."""
    threshold_days = get_overdue_threshold_days(db)

    stmt = (
        select(Complaint)
        .options(
            joinedload(Complaint.resident),
            joinedload(Complaint.status_history),
        )
        .where(Complaint.id == complaint_id)
    )
    complaint = db.scalars(stmt).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Ownership check: non-admin residents cannot view another resident's complaint
    if current_user.role != UserRole.ADMIN and complaint.resident_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this complaint",
        )

    # Sort history oldest to newest (ascending)
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


@router.patch(
    "/{complaint_id}",
    response_model=ComplaintRead,
    status_code=status.HTTP_200_OK,
    summary="Edit an open complaint by resident owner",
    responses={
        status.HTTP_200_OK: {
            "description": "successful update",
            "model": ComplaintRead,
        },
        status.HTTP_403_FORBIDDEN: {
            "description": "authenticated user is not the complaint owner",
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "complaint not found",
        },
        status.HTTP_409_CONFLICT: {
            "description": "complaint is not OPEN and cannot be edited",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "invalid or empty update payload",
        },
    },
)
def update_complaint(
    complaint_id: int,
    payload: ComplaintUpdateRequest,
    current_user: User = Depends(require_resident),
    db: Session = Depends(get_db),
) -> ComplaintRead:
    """Resident edits their own complaint while it remains in OPEN status.

    Protected fields (resident_id, status, priority, created_at, resolved_at, history) are strictly immutable.
    """
    threshold_days = get_overdue_threshold_days(db)

    stmt = (
        select(Complaint)
        .options(joinedload(Complaint.resident))
        .where(Complaint.id == complaint_id)
    )
    complaint = db.scalars(stmt).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Rule 1 & 3: Only the authenticated owner may edit the complaint; return 403 when another resident attempts access
    if complaint.resident_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this complaint",
        )

    # Rule 2 & 4: Only complaints with status OPEN may be edited; return 409 when IN_PROGRESS or RESOLVED
    if complaint.status != ComplaintStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot edit complaint in '{complaint.status}' status. Only OPEN complaints can be edited.",
        )

    # Apply editable fields only from allowlist
    if payload.title is not None:
        complaint.title = payload.title.strip()
    if payload.category is not None:
        complaint.category = payload.category
    if payload.description is not None:
        complaint.description = payload.description.strip()
    if payload.photo_url is not None:
        complaint.photo_url = payload.photo_url.strip() if payload.photo_url else None

    # Update updated_at timestamp
    complaint.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(complaint)

    # Return existing ComplaintRead response shape
    return map_complaint_read(complaint, threshold_days)
