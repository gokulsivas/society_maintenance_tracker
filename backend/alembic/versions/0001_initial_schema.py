"""Initial schema migration

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-21 17:05:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

user_role_enum = postgresql.ENUM(
    "ADMIN", "RESIDENT",
    name="user_role",
    schema="public",
    create_type=False,
)
complaint_category_enum = postgresql.ENUM(
    "PLUMBING", "ELECTRICAL", "CARPENTRY", "CLEANLINESS", "SECURITY", "OTHER",
    name="complaint_category",
    schema="public",
    create_type=False,
)
complaint_priority_enum = postgresql.ENUM(
    "LOW", "MEDIUM", "HIGH",
    name="complaint_priority",
    schema="public",
    create_type=False,
)
complaint_status_enum = postgresql.ENUM(
    "OPEN", "IN_PROGRESS", "RESOLVED",
    name="complaint_status",
    schema="public",
    create_type=False,
)


def upgrade() -> None:
    # Create enum types if in postgresql
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        postgresql.ENUM("ADMIN", "RESIDENT", name="user_role", schema="public").create(bind, checkfirst=True)
        postgresql.ENUM(
            "PLUMBING", "ELECTRICAL", "CARPENTRY", "CLEANLINESS", "SECURITY", "OTHER",
            name="complaint_category",
            schema="public",
        ).create(bind, checkfirst=True)
        postgresql.ENUM("LOW", "MEDIUM", "HIGH", name="complaint_priority", schema="public").create(bind, checkfirst=True)
        postgresql.ENUM("OPEN", "IN_PROGRESS", "RESOLVED", name="complaint_status", schema="public").create(bind, checkfirst=True)

    # 1. Users Table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, server_default="RESIDENT", nullable=False),
        sa.Column("flat_no", sa.String(length=50), nullable=True),
        sa.Column("phone_number", sa.String(length=20), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_role", "users", ["role"])

    # 2. Complaints Table
    op.create_table(
        "complaints",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", complaint_category_enum, nullable=False),
        sa.Column("priority", complaint_priority_enum, server_default="MEDIUM", nullable=False),
        sa.Column("status", complaint_status_enum, server_default="OPEN", nullable=False),
        sa.Column("photo_url", sa.String(length=500), nullable=True),
        sa.Column("resident_id", sa.Integer(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["resident_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_complaints_resident_id", "complaints", ["resident_id"])
    op.create_index("idx_complaints_status", "complaints", ["status"])
    op.create_index("idx_complaints_created_at", "complaints", ["created_at"])

    # 3. Complaint Status History Table
    op.create_table(
        "complaint_status_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("complaint_id", sa.Integer(), nullable=False),
        sa.Column("from_status", complaint_status_enum, nullable=True),
        sa.Column("to_status", complaint_status_enum, nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("changed_by", sa.Integer(), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["changed_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_csh_complaint_id", "complaint_status_history", ["complaint_id"])
    op.create_index("idx_csh_changed_by", "complaint_status_history", ["changed_by"])
    op.create_index("idx_csh_changed_at", "complaint_status_history", ["changed_at"])

    # 4. Notices Table
    op.create_table(
        "notices",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_important", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("posted_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["posted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_notices_posted_by", "notices", ["posted_by"])
    op.create_index("idx_notices_listing", "notices", [sa.text("is_important DESC"), sa.text("created_at DESC")])

    # 5. Settings Table
    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("settings")
    op.drop_index("idx_notices_listing", table_name="notices")
    op.drop_index("idx_notices_posted_by", table_name="notices")
    op.drop_table("notices")
    op.drop_index("idx_csh_changed_at", table_name="complaint_status_history")
    op.drop_index("idx_csh_changed_by", table_name="complaint_status_history")
    op.drop_index("idx_csh_complaint_id", table_name="complaint_status_history")
    op.drop_table("complaint_status_history")
    op.drop_index("idx_complaints_created_at", table_name="complaints")
    op.drop_index("idx_complaints_status", table_name="complaints")
    op.drop_index("idx_complaints_resident_id", table_name="complaints")
    op.drop_table("complaints")
    op.drop_index("idx_users_role", table_name="users")
    op.drop_index("idx_users_email", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        postgresql.ENUM(name="complaint_status", schema="public").drop(bind, checkfirst=True)
        postgresql.ENUM(name="complaint_priority", schema="public").drop(bind, checkfirst=True)
        postgresql.ENUM(name="complaint_category", schema="public").drop(bind, checkfirst=True)
        postgresql.ENUM(name="user_role", schema="public").drop(bind, checkfirst=True)
