import logging
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.dependencies import require_admin
from backend.app.core.email import send_important_notice_broadcast
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.models.notice import Notice
from backend.app.routers.notices import map_notice_read
from backend.app.schemas.notice import (
    NoticeCreateRequest,
    NoticeUpdateRequest,
    NoticeRead,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "",
    response_model=NoticeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new notice (Admin only)",
)
def create_notice(
    payload: NoticeCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> NoticeRead:
    """Administrator publishes a notice.

    If marked important (is_important=True), broadcasts an email notification to active residents post-commit.
    """
    notice = Notice(
        title=payload.title.strip(),
        body=payload.body.strip(),
        is_important=payload.is_important,
        posted_by=current_user.id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # Load author relationship for response
    db.refresh(notice, attribute_names=["author"])

    # Post-commit broadcast for newly created important notices
    if notice.is_important:
        try:
            active_residents = db.scalars(
                select(User).where(
                    User.role == UserRole.RESIDENT,
                    User.is_active == True,
                )
            ).all()
            recipient_list = [
                {"email": r.email, "name": r.name}
                for r in active_residents
                if r.email
            ]
            if recipient_list:
                send_important_notice_broadcast(
                    recipients=recipient_list,
                    notice_title=notice.title,
                    notice_body=notice.body,
                    notice_id=notice.id,
                )
        except Exception as exc:
            logger.error("Post-commit important notice broadcast failed: %s", type(exc).__name__)

    return map_notice_read(notice)


@router.patch(
    "/{notice_id}",
    response_model=NoticeRead,
    status_code=status.HTTP_200_OK,
    summary="Update notice details (Admin only)",
)
def update_notice(
    notice_id: int,
    payload: NoticeUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> NoticeRead:
    """Administrator updates notice title, body, or importance. posted_by and created_at remain immutable."""
    notice = db.scalars(
        select(Notice)
        .options(joinedload(Notice.author))
        .where(Notice.id == notice_id)
    ).first()

    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    if payload.title is not None:
        notice.title = payload.title.strip()
    if payload.body is not None:
        notice.body = payload.body.strip()
    if payload.is_important is not None:
        notice.is_important = payload.is_important

    db.commit()
    db.refresh(notice)

    return map_notice_read(notice)


@router.delete(
    "/{notice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a notice (Admin only)",
)
def delete_notice(
    notice_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    """Administrator deletes a notice. Returns 204 No Content on success."""
    notice = db.scalars(select(Notice).where(Notice.id == notice_id)).first()

    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found",
        )

    db.delete(notice)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
