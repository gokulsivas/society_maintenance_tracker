import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user
from backend.app.models.user import User
from backend.app.models.notice import Notice
from backend.app.schemas.notice import NoticeRead, PaginatedNoticesResponse

router = APIRouter()


def map_notice_read(notice: Notice) -> NoticeRead:
    """Transform Notice model into NoticeRead schema including author_name."""
    return NoticeRead(
        id=notice.id,
        title=notice.title,
        body=notice.body,
        is_important=notice.is_important,
        posted_by=notice.posted_by,
        author_name=notice.author.name if notice.author else None,
        created_at=notice.created_at,
        updated_at=notice.updated_at,
    )


@router.get(
    "",
    response_model=PaginatedNoticesResponse,
    status_code=status.HTTP_200_OK,
    summary="List all notices (important notices pinned, newest first)",
)
def list_notices(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedNoticesResponse:
    """Retrieve all notices with pagination. Important notices sort first, then newest creation date."""
    # 1. Total count query
    total_items = db.scalar(select(func.count(Notice.id))) or 0

    # 2. Paginated query ordered by is_important DESC, created_at DESC
    offset = (page - 1) * page_size
    stmt = (
        select(Notice)
        .options(joinedload(Notice.author))
        .order_by(Notice.is_important.desc(), Notice.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    notices = db.scalars(stmt).all()
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1

    return PaginatedNoticesResponse(
        items=[map_notice_read(n) for n in notices],
        total=total_items,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{notice_id}",
    response_model=NoticeRead,
    status_code=status.HTTP_200_OK,
    summary="Get single notice detail",
)
def get_notice_detail(
    notice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoticeRead:
    """Retrieve details for a specific notice by ID."""
    stmt = (
        select(Notice)
        .options(joinedload(Notice.author))
        .where(Notice.id == notice_id)
    )
    notice = db.scalars(stmt).first()

    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    return map_notice_read(notice)
