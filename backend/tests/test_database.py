import os
import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings
from backend.app.core.database import Base
from backend.app.core.security import hash_password, verify_password
from backend.app.models.enums import (
    UserRole,
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)
from backend.app.models.user import User
from backend.app.models.complaint import Complaint, ComplaintStatusHistory
from backend.app.models.notice import Notice
from backend.app.models.setting import Setting
from backend.app.scripts.seed import seed_data


@pytest.fixture
def sqlite_db_session():
    """In-memory SQLite engine and session for fast local unit testing without Postgres."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


def test_models_metadata_registration():
    """Verify all 5 required tables are registered in Base.metadata."""
    table_names = set(Base.metadata.tables.keys())
    expected_tables = {
        "users",
        "complaints",
        "complaint_status_history",
        "notices",
        "settings",
    }
    assert expected_tables.issubset(table_names), f"Missing tables: {expected_tables - table_names}"


def test_password_hashing_and_verification():
    """Verify password hashing with bcrypt works correctly."""
    plain = "SecurePassword@123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_create_and_query_user(sqlite_db_session):
    """Verify creating a user and querying it."""
    user = User(
        name="Test Resident",
        email="test_resident@society.com",
        password_hash=hash_password("ResidentPass@123"),
        role=UserRole.RESIDENT,
        flat_no="B-202",
        phone_number="9876543210",
        is_active=True,
    )
    sqlite_db_session.add(user)
    sqlite_db_session.commit()

    saved_user = sqlite_db_session.scalars(
        select(User).where(User.email == "test_resident@society.com")
    ).first()
    assert saved_user is not None
    assert saved_user.name == "Test Resident"
    assert saved_user.role == UserRole.RESIDENT
    assert saved_user.flat_no == "B-202"
    assert verify_password("ResidentPass@123", saved_user.password_hash) is True


def test_create_complaint_and_status_history(sqlite_db_session):
    """Verify complaint lifecycle and status history relationship."""
    user = User(
        name="John Resident",
        email="john@society.com",
        password_hash=hash_password("Pass123"),
        role=UserRole.RESIDENT,
        flat_no="A-101",
    )
    sqlite_db_session.add(user)
    sqlite_db_session.commit()

    # Raise a complaint
    complaint = Complaint(
        title="Leaking pipe in kitchen",
        description="Water is dripping continuously from the kitchen sink pipe.",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.OPEN,
        photo_url="https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
        resident_id=user.id,
    )
    sqlite_db_session.add(complaint)
    sqlite_db_session.commit()

    # Insert status history for raising
    history_initial = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=None,
        to_status=ComplaintStatus.OPEN,
        note="Complaint raised by resident",
        changed_by=user.id,
    )
    sqlite_db_session.add(history_initial)

    # Transition to IN_PROGRESS
    complaint.status = ComplaintStatus.IN_PROGRESS
    history_progress = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=ComplaintStatus.OPEN,
        to_status=ComplaintStatus.IN_PROGRESS,
        note="Plumber assigned to inspect",
        changed_by=user.id,
    )
    sqlite_db_session.add(history_progress)
    sqlite_db_session.commit()

    # Verify query and relationships
    queried_complaint = sqlite_db_session.scalars(
        select(Complaint).where(Complaint.id == complaint.id)
    ).first()
    assert queried_complaint is not None
    assert queried_complaint.status == ComplaintStatus.IN_PROGRESS
    assert queried_complaint.resident.email == "john@society.com"
    assert len(queried_complaint.status_history) == 2


def test_create_notice(sqlite_db_session):
    """Verify creating notices with importance flag."""
    admin = User(
        name="Admin User",
        email="admin_notice@society.com",
        password_hash=hash_password("AdminPass"),
        role=UserRole.ADMIN,
    )
    sqlite_db_session.add(admin)
    sqlite_db_session.commit()

    notice = Notice(
        title="Water Tank Cleaning Schedule",
        body="Water supply will be suspended tomorrow from 10 AM to 2 PM.",
        is_important=True,
        posted_by=admin.id,
    )
    sqlite_db_session.add(notice)
    sqlite_db_session.commit()

    saved_notice = sqlite_db_session.scalars(
        select(Notice).where(Notice.id == notice.id)
    ).first()
    assert saved_notice is not None
    assert saved_notice.is_important is True
    assert saved_notice.author.email == "admin_notice@society.com"


def test_setting_key_primary_key(sqlite_db_session):
    """Verify settings table with string key as primary key."""
    setting = Setting(
        key="overdue_threshold_days",
        value="3",
        description="Threshold days for overdue calculation",
    )
    sqlite_db_session.add(setting)
    sqlite_db_session.commit()

    saved_setting = sqlite_db_session.scalars(
        select(Setting).where(Setting.key == "overdue_threshold_days")
    ).first()
    assert saved_setting is not None
    assert saved_setting.value == "3"


def test_idempotent_seed_data(sqlite_db_session):
    """Verify seed_data creates initial records and is idempotent upon multiple runs."""
    # First run
    first_run = seed_data(sqlite_db_session)
    assert any("Admin" in msg and "created" in msg for msg in first_run["users"])
    assert any("Resident" in msg and "created" in msg for msg in first_run["users"])
    assert any("overdue_threshold_days" in msg and "created" in msg for msg in first_run["settings"])

    # Second run (should not fail with duplicate key and should report existing)
    second_run = seed_data(sqlite_db_session)
    assert any("Admin" in msg and "already exists" in msg for msg in second_run["users"])
    assert any("Resident" in msg and "already exists" in msg for msg in second_run["users"])
    assert any("overdue_threshold_days" in msg and "already exists" in msg for msg in second_run["settings"])


@pytest.mark.skipif(
    not settings.DATABASE_URL or "user:password" in settings.DATABASE_URL,
    reason="PostgreSQL DATABASE_URL not configured or using default placeholder.",
)
def test_live_postgres_connection_and_migration():
    """Live integration test against configured PostgreSQL / Neon database."""
    from backend.app.core.database import engine, SessionLocal

    assert engine is not None, "Engine should be initialized when DATABASE_URL is present"
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_initial_migration_enum_configuration():
    """Regression test: Verify that 0001_initial_schema enums use create_type=False and public schema."""
    import importlib.util
    migration_path = backend_dir / "alembic" / "versions" / "0001_initial_schema.py"
    spec = importlib.util.spec_from_file_location("initial_schema", migration_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    for enum_attr in ["user_role_enum", "complaint_category_enum", "complaint_priority_enum", "complaint_status_enum"]:
        assert hasattr(module, enum_attr), f"Missing {enum_attr} in migration module"
        enum_obj = getattr(module, enum_attr)
        assert getattr(enum_obj, "create_type", None) is False, f"{enum_attr} must have create_type=False"
        assert getattr(enum_obj, "schema", None) == "public", f"{enum_attr} must have schema='public'"


def test_initial_migration_avoids_duplicate_create_type_on_postgres_dialect():
    """Regression test: Verify that migration enum definitions prevent duplicate CREATE TYPE statements."""
    import importlib.util
    migration_path = backend_dir / "alembic" / "versions" / "0001_initial_schema.py"
    spec = importlib.util.spec_from_file_location("initial_schema_test", migration_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    assert module.user_role_enum.create_type is False
    assert module.complaint_category_enum.create_type is False
    assert module.complaint_priority_enum.create_type is False
    assert module.complaint_status_enum.create_type is False
