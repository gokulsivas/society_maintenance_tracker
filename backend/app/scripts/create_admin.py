import argparse
import getpass
import os
import sys
from pathlib import Path
from typing import Optional
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


def create_or_promote_admin(
    db: Session,
    email: str,
    password: Optional[str] = None,
    name: str = "Society Admin",
    flat_no: Optional[str] = "Office-101",
    confirm_production: bool = False,
) -> dict:
    """Idempotently create an admin account or promote an existing resident to admin.

    - Creates the admin if the email does not exist (requires password).
    - Promotes existing RESIDENT to ADMIN.
    - Never downgrades an existing ADMIN.
    - Hashes passwords using existing bcrypt utility.
    - Refuses to execute in production environment without confirm_production=True.
    """
    is_prod = (
        os.getenv("ENVIRONMENT", "").lower() == "production"
        or settings.ENVIRONMENT.lower() == "production"
    )
    if is_prod and not confirm_production:
        raise ValueError(
            "Running in production environment requires explicit confirmation flag: --confirm-production"
        )

    normalized_email = email.lower().strip()
    if not normalized_email or "@" not in normalized_email:
        raise ValueError(f"Invalid email address provided: '{email}'")

    user = db.scalars(select(User).where(User.email == normalized_email)).first()

    if user:
        if user.role == UserRole.ADMIN:
            if password:
                user.password_hash = hash_password(password)
                db.commit()
                return {
                    "action": "noop_password_updated",
                    "email": normalized_email,
                    "role": UserRole.ADMIN.value,
                    "message": f"User '{normalized_email}' is already an ADMIN. Password was updated.",
                }
            return {
                "action": "noop",
                "email": normalized_email,
                "role": UserRole.ADMIN.value,
                "message": f"User '{normalized_email}' is already an ADMIN. No role changes needed.",
            }
        else:
            # Promote resident to ADMIN
            user.role = UserRole.ADMIN
            if password:
                user.password_hash = hash_password(password)
            if not user.is_active:
                user.is_active = True
            db.commit()
            return {
                "action": "promoted",
                "email": normalized_email,
                "role": UserRole.ADMIN.value,
                "message": f"User '{normalized_email}' has been successfully promoted to ADMIN.",
            }
    else:
        # Create new admin user
        if not password:
            raise ValueError(f"A password is required to create new admin user '{normalized_email}'.")

        new_admin = User(
            name=name.strip() if name else "Society Admin",
            email=normalized_email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            flat_no=flat_no.strip() if flat_no else None,
            is_active=True,
        )
        db.add(new_admin)
        db.commit()
        return {
            "action": "created",
            "email": normalized_email,
            "role": UserRole.ADMIN.value,
            "message": f"Admin user '{normalized_email}' created successfully.",
        }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Idempotently create or promote an administrator account for Society Maintenance Tracker."
    )
    parser.add_argument(
        "--email",
        type=str,
        help="Email address for the admin account (or set ADMIN_EMAIL env var)",
    )
    parser.add_argument(
        "--password",
        type=str,
        help="Password for the admin account (or set ADMIN_PASSWORD env var; prompts if omitted)",
    )
    parser.add_argument(
        "--name",
        type=str,
        default=os.getenv("ADMIN_NAME", "Society Admin"),
        help="Full name of the admin user (default: Society Admin)",
    )
    parser.add_argument(
        "--flat",
        type=str,
        default=os.getenv("ADMIN_FLAT", "Office-101"),
        help="Apartment / Office flat number (default: Office-101)",
    )
    parser.add_argument(
        "--confirm-production",
        action="store_true",
        default=False,
        help="Explicit confirmation required when running in production environment.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if SessionLocal is None:
        print("[ERROR] DATABASE_URL is not configured. Cannot connect to database.")
        sys.exit(1)

    email = args.email or os.getenv("ADMIN_EMAIL")
    if not email:
        email = input("Enter admin email address: ").strip()

    password = args.password or os.getenv("ADMIN_PASSWORD")
    if not password and sys.stdin.isatty():
        password = getpass.getpass("Enter admin password (leave blank if promoting existing user without password reset): ").strip() or None

    db = SessionLocal()
    try:
        result = create_or_promote_admin(
            db=db,
            email=email,
            password=password,
            name=args.name,
            flat_no=args.flat,
            confirm_production=args.confirm_production,
        )
        print(f"[SUCCESS] {result['message']}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
