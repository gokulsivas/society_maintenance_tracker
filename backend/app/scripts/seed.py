import argparse
import os
import sys
from datetime import datetime, timezone
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

# Intentional, isolated disposable demo credentials (documented for evaluators)
DEMO_ADMIN_EMAIL = "admin.demo@society-tracker.com"
DEMO_ADMIN_NAME = "Demo Society Admin"
DEMO_ADMIN_PASSWORD = "DemoAdmin@2026"
DEMO_ADMIN_FLAT = "Office-101"

DEMO_RESIDENT_EMAIL = "resident.demo@society-tracker.com"
DEMO_RESIDENT_NAME = "Demo Resident User"
DEMO_RESIDENT_PASSWORD = "DemoResident@2026"
DEMO_RESIDENT_FLAT = "B-204"
DEMO_RESIDENT_PHONE = "9876543210"


def seed_demo_data(
    db: Session,
    dry_run: bool = False,
    confirm_production: bool = False,
) -> dict:
    """Idempotently seeds disposable demo accounts and sample evaluation data.

    - Creates demo admin & resident accounts (if not already present).
    - Never deletes or modifies non-demo user data.
    - Creates sample complaints for the demo resident.
    - Creates sample notices authored by the demo admin.
    - Ensures overdue SLA threshold setting exists.
    - If dry_run is True, logs planned actions without committing.
    """
    is_prod = (
        os.getenv("ENVIRONMENT", "").lower() == "production"
        or settings.ENVIRONMENT.lower() == "production"
    )
    if is_prod and not confirm_production and not dry_run:
        raise ValueError(
            "Executing against production database requires the explicit confirmation flag: --confirm-production"
        )

    results = {
        "users": [],
        "complaints": [],
        "notices": [],
        "settings": [],
    }

    # ---------------------------------------------------------
    # 1. Demo Admin Account
    # ---------------------------------------------------------
    admin = db.scalars(select(User).where(User.email == DEMO_ADMIN_EMAIL)).first()
    if not admin:
        if not dry_run:
            admin = User(
                name=DEMO_ADMIN_NAME,
                email=DEMO_ADMIN_EMAIL,
                password_hash=hash_password(DEMO_ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                flat_no=DEMO_ADMIN_FLAT,
                is_active=True,
            )
            db.add(admin)
            db.flush()
        results["users"].append(f"[CREATE] Admin ({DEMO_ADMIN_EMAIL}) created")
    else:
        # Ensure role remains ADMIN and password matches demo credentials
        if not dry_run:
            admin.role = UserRole.ADMIN
            admin.password_hash = hash_password(DEMO_ADMIN_PASSWORD)
            admin.is_active = True
            db.flush()
        results["users"].append(f"[EXISTS] Admin ({DEMO_ADMIN_EMAIL}) already exists (ID: {admin.id})")

    # ---------------------------------------------------------
    # 2. Demo Resident Account
    # ---------------------------------------------------------
    resident = db.scalars(select(User).where(User.email == DEMO_RESIDENT_EMAIL)).first()
    if not resident:
        if not dry_run:
            resident = User(
                name=DEMO_RESIDENT_NAME,
                email=DEMO_RESIDENT_EMAIL,
                password_hash=hash_password(DEMO_RESIDENT_PASSWORD),
                role=UserRole.RESIDENT,
                flat_no=DEMO_RESIDENT_FLAT,
                phone_number=DEMO_RESIDENT_PHONE,
                is_active=True,
            )
            db.add(resident)
            db.flush()
        results["users"].append(f"[CREATE] Resident ({DEMO_RESIDENT_EMAIL}) created")
    else:
        # Ensure role is RESIDENT and password matches demo credentials
        if not dry_run:
            resident.role = UserRole.RESIDENT
            resident.password_hash = hash_password(DEMO_RESIDENT_PASSWORD)
            resident.is_active = True
            db.flush()
        results["users"].append(f"[EXISTS] Resident ({DEMO_RESIDENT_EMAIL}) already exists (ID: {resident.id})")

    # ---------------------------------------------------------
    # 3. Sample Complaints for Demo Resident
    # ---------------------------------------------------------
    sample_complaints_def = [
        {
            "title": "Corridor Light Flickering (Floor 2)",
            "description": "The corridor ceiling light fixture near flat B-204 is flickering intermittently and needs ballast replacement.",
            "category": ComplaintCategory.ELECTRICAL,
            "priority": ComplaintPriority.MEDIUM,
            "status": ComplaintStatus.OPEN,
            "transitions": [],
        },
        {
            "title": "Water Leakage in Kitchen Pipe",
            "description": "Continuous water dripping from the main cold-water supply pipe under the kitchen sink. Maintenance team conducted initial inspection.",
            "category": ComplaintCategory.PLUMBING,
            "priority": ComplaintPriority.HIGH,
            "status": ComplaintStatus.IN_PROGRESS,
            "transitions": [
                {
                    "from_status": ComplaintStatus.OPEN,
                    "to_status": ComplaintStatus.IN_PROGRESS,
                    "note": "Assigned to plumbing contractor for gasket repair.",
                }
            ],
        },
        {
            "title": "Broken Gym Treadmill Belt",
            "description": "Clubhouse treadmill #2 belt was slipping during running. Technician completed alignment and lubrication.",
            "category": ComplaintCategory.OTHER,
            "priority": ComplaintPriority.LOW,
            "status": ComplaintStatus.RESOLVED,
            "transitions": [
                {
                    "from_status": ComplaintStatus.OPEN,
                    "to_status": ComplaintStatus.IN_PROGRESS,
                    "note": "Fitness equipment vendor contacted.",
                },
                {
                    "from_status": ComplaintStatus.IN_PROGRESS,
                    "to_status": ComplaintStatus.RESOLVED,
                    "note": "Treadmill belt replaced, tested, and verified operational.",
                },
            ],
        },
    ]

    for c_def in sample_complaints_def:
        # Check if complaint with this title already exists for the resident
        existing_c = None
        if resident and resident.id:
            existing_c = db.scalars(
                select(Complaint).where(
                    Complaint.resident_id == resident.id,
                    Complaint.title == c_def["title"],
                )
            ).first()

        if not existing_c:
            if not dry_run and resident and resident.id:
                complaint = Complaint(
                    title=c_def["title"],
                    description=c_def["description"],
                    category=c_def["category"],
                    priority=c_def["priority"],
                    status=c_def["status"],
                    resident_id=resident.id,
                    resolved_at=datetime.now(timezone.utc) if c_def["status"] == ComplaintStatus.RESOLVED else None,
                )
                db.add(complaint)
                db.flush()

                # Add initial creation transition record
                history_open = ComplaintStatusHistory(
                    complaint_id=complaint.id,
                    from_status=None,
                    to_status=ComplaintStatus.OPEN,
                    note="Complaint raised by resident",
                    changed_by=resident.id,
                )
                db.add(history_open)

                # Add intermediate and final transition records
                for t in c_def["transitions"]:
                    hist = ComplaintStatusHistory(
                        complaint_id=complaint.id,
                        from_status=t["from_status"],
                        to_status=t["to_status"],
                        note=t["note"],
                        changed_by=admin.id if admin else None,
                    )
                    db.add(hist)
            results["complaints"].append(f"[CREATE] Complaint: '{c_def['title']}' ({c_def['status'].value})")
        else:
            results["complaints"].append(f"[EXISTS] Complaint: '{c_def['title']}' (ID: {existing_c.id})")

    # ---------------------------------------------------------
    # 4. Sample Notices Posted by Demo Admin
    # ---------------------------------------------------------
    sample_notices_def = [
        {
            "title": "Scheduled Water Tank Cleaning - Saturday 9 AM to 1 PM",
            "body": "Please store sufficient water in advance. The overhead and underground domestic water tanks will undergo quarterly sanitization. Water supply will be temporarily paused between 9:00 AM and 1:00 PM.",
            "is_important": True,
        },
        {
            "title": "Annual General Body Meeting (AGM) Announcement",
            "body": "The Annual General Body Meeting for all society apartment owners and residents will take place next Sunday at 10:30 AM in the Clubhouse Community Hall. Agenda items include annual budget approvals and security enhancements.",
            "is_important": True,
        },
        {
            "title": "Clubhouse Booking Guidelines & Pool Maintenance",
            "body": "Residents can now reserve the party hall up to 30 days in advance via the society portal. Note that the swimming pool will be closed every Monday for weekly chemical treatment and filtration.",
            "is_important": False,
        },
    ]

    for n_def in sample_notices_def:
        existing_n = db.scalars(
            select(Notice).where(Notice.title == n_def["title"])
        ).first()

        if not existing_n:
            if not dry_run:
                notice = Notice(
                    title=n_def["title"],
                    body=n_def["body"],
                    is_important=n_def["is_important"],
                    posted_by=admin.id if admin else None,
                )
                db.add(notice)
            results["notices"].append(f"[CREATE] Notice: '{n_def['title']}' (Important: {n_def['is_important']})")
        else:
            results["notices"].append(f"[EXISTS] Notice: '{n_def['title']}' (ID: {existing_n.id})")

    # ---------------------------------------------------------
    # 5. Overdue SLA Setting
    # ---------------------------------------------------------
    overdue_key = "overdue_threshold_days"
    overdue_setting = db.scalars(
        select(Setting).where(Setting.key == overdue_key)
    ).first()

    if not overdue_setting:
        if not dry_run:
            overdue_setting = Setting(
                key=overdue_key,
                value=str(settings.DEFAULT_OVERDUE_THRESHOLD_DAYS),
                description="Number of days before an unresolved complaint is marked overdue",
            )
            db.add(overdue_setting)
        results["settings"].append(f"[CREATE] Setting '{overdue_key}={settings.DEFAULT_OVERDUE_THRESHOLD_DAYS}' created")
    else:
        results["settings"].append(f"[EXISTS] Setting '{overdue_key}' already exists (value={overdue_setting.value})")

    if not dry_run:
        db.commit()

    return results


# Backward compatibility alias
seed_data = seed_demo_data


def parse_args():
    parser = argparse.ArgumentParser(
        description="Idempotently seed demo accounts and evaluation sample data for Society Maintenance Tracker."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Simulate the seeding process and print planned changes without modifying the database.",
    )
    parser.add_argument(
        "--confirm-production",
        action="store_true",
        default=False,
        help="Explicit confirmation required when executing against a production database.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if SessionLocal is None:
        print("[ERROR] DATABASE_URL is not configured. Cannot connect to database.")
        sys.exit(1)

    mode = "DRY-RUN (No DB modifications)" if args.dry_run else "EXECUTION (DB write)"
    print(f"Running database seeder [{mode}]...")

    db = SessionLocal()
    try:
        results = seed_demo_data(
            db=db,
            dry_run=args.dry_run,
            confirm_production=args.confirm_production,
        )
        print("\nSeeding summary:")
        for category, logs in results.items():
            print(f"\n[{category.upper()}] ({len(logs)} items):")
            for log in logs:
                print(f"  {log}")
        print("\nSeeding finished successfully.")
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seeding failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
