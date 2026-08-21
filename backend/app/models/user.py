from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.enums import UserRole

if TYPE_CHECKING:
    from backend.app.models.complaint import Complaint, ComplaintStatusHistory
    from backend.app.models.notice import Notice


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=True),
        default=UserRole.RESIDENT,
        nullable=False,
        index=True,
    )
    flat_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint",
        back_populates="resident",
        foreign_keys="Complaint.resident_id",
        cascade="all, delete-orphan",
    )
    status_changes: Mapped[List["ComplaintStatusHistory"]] = relationship(
        "ComplaintStatusHistory",
        back_populates="user",
        foreign_keys="ComplaintStatusHistory.changed_by",
    )
    notices: Mapped[List["Notice"]] = relationship(
        "Notice",
        back_populates="author",
        foreign_keys="Notice.posted_by",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
