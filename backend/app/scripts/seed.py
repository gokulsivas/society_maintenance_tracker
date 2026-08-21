import sys
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.core.security import hash_password
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.models.setting import Setting


def seed_data(db: Session) -> dict:
    """Idempotently seed the initial database data."""
    seeded = {"users": [], "settings": []}

    # 1. Seed Admin User
    admin_stmt = select(User).where(User.email == settings.SEED_ADMIN_EMAIL)
    admin = db.scalars(admin_stmt).first()
    if not admin:
        admin = User(
            name=settings.SEED_ADMIN_NAME,
            email=settings.SEED_ADMIN_EMAIL,
            password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            flat_no=settings.SEED_ADMIN_FLAT,
            is_active=True,
        )
        db.add(admin)
        seeded["users"].append(f"Admin ({settings.SEED_ADMIN_EMAIL}) created")
    else:
        seeded["users"].append(f"Admin ({settings.SEED_ADMIN_EMAIL}) already exists")

    # 2. Seed Resident User
    resident_stmt = select(User).where(User.email == settings.SEED_RESIDENT_EMAIL)
    resident = db.scalars(resident_stmt).first()
    if not resident:
        resident = User(
            name=settings.SEED_RESIDENT_NAME,
            email=settings.SEED_RESIDENT_EMAIL,
            password_hash=hash_password(settings.SEED_RESIDENT_PASSWORD),
            role=UserRole.RESIDENT,
            flat_no=settings.SEED_RESIDENT_FLAT,
            is_active=True,
        )
        db.add(resident)
        seeded["users"].append(f"Resident ({settings.SEED_RESIDENT_EMAIL}) created")
    else:
        seeded["users"].append(f"Resident ({settings.SEED_RESIDENT_EMAIL}) already exists")

    # 3. Seed Overdue Threshold Setting
    overdue_key = "overdue_threshold_days"
    overdue_stmt = select(Setting).where(Setting.key == overdue_key)
    overdue_setting = db.scalars(overdue_stmt).first()
    if not overdue_setting:
        overdue_setting = Setting(
            key=overdue_key,
            value=str(settings.DEFAULT_OVERDUE_THRESHOLD_DAYS),
            description="Number of days before an unresolved complaint is marked overdue",
        )
        db.add(overdue_setting)
        seeded["settings"].append(f"Setting '{overdue_key}={settings.DEFAULT_OVERDUE_THRESHOLD_DAYS}' created")
    else:
        seeded["settings"].append(f"Setting '{overdue_key}' already exists (value={overdue_setting.value})")

    db.commit()
    return seeded


def main() -> None:
    if SessionLocal is None:
        print("[ERROR] DATABASE_URL is not set. Cannot run seed script.")
        sys.exit(1)

    print("Running database seed...")
    db = SessionLocal()
    try:
        results = seed_data(db)
        print("Database seed completed successfully:")
        for category, logs in results.items():
            for log in logs:
                print(f" - [{category}] {log}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database seed failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
