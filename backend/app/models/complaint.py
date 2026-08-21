from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.enums import (
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)

if TYPE_CHECKING:
    from backend.app.models.user import User


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[ComplaintCategory] = mapped_column(
        SAEnum(ComplaintCategory, name="complaint_category", native_enum=True),
        nullable=False,
    )
    priority: Mapped[ComplaintPriority] = mapped_column(
        SAEnum(ComplaintPriority, name="complaint_priority", native_enum=True),
        default=ComplaintPriority.MEDIUM,
        nullable=False,
    )
    status: Mapped[ComplaintStatus] = mapped_column(
        SAEnum(ComplaintStatus, name="complaint_status", native_enum=True),
        default=ComplaintStatus.OPEN,
        nullable=False,
        index=True,
    )
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resident_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    resident: Mapped["User"] = relationship(
        "User", back_populates="complaints", foreign_keys=[resident_id]
    )
    status_history: Mapped[List["ComplaintStatusHistory"]] = relationship(
        "ComplaintStatusHistory",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="ComplaintStatusHistory.changed_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Complaint(id={self.id}, status='{self.status}', resident_id={self.resident_id})>"


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    complaint_id: Mapped[int] = mapped_column(
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status: Mapped[Optional[ComplaintStatus]] = mapped_column(
        SAEnum(
            ComplaintStatus,
            name="complaint_status",
            native_enum=True,
            create_type=False,
        ),
        nullable=True,
    )
    to_status: Mapped[ComplaintStatus] = mapped_column(
        SAEnum(
            ComplaintStatus,
            name="complaint_status",
            native_enum=True,
            create_type=False,
        ),
        nullable=False,
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    complaint: Mapped["Complaint"] = relationship(
        "Complaint", back_populates="status_history", foreign_keys=[complaint_id]
    )
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="status_changes", foreign_keys=[changed_by]
    )

    def __repr__(self) -> str:
        return (
            f"<ComplaintStatusHistory(id={self.id}, complaint_id={self.complaint_id}, "
            f"from_status='{self.from_status}', to_status='{self.to_status}')>"
        )
