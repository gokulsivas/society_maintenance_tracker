import sys
from datetime import timedelta
from pathlib import Path
import pytest
from sqlalchemy import select
from fastapi import APIRouter, Depends, status
from fastapi.testclient import TestClient

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.security import hash_password, create_access_token
from backend.app.core.dependencies import require_admin, require_resident
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.main import app

# Test router to verify RBAC guards
rbac_router = APIRouter(prefix="/api/test-rbac", tags=["RBAC Test"])


@rbac_router.get("/admin-only")
def admin_only_endpoint(admin: User = Depends(require_admin)):
    return {"message": "Welcome Admin", "user_id": admin.id}


@rbac_router.get("/resident-only")
def resident_only_endpoint(resident: User = Depends(require_resident)):
    return {"message": "Welcome Resident", "user_id": resident.id}


# Avoid registering router multiple times
if not any(r.path == "/api/test-rbac/admin-only" for r in app.routes if hasattr(r, "path")):
    app.include_router(rbac_router)


def test_resident_registration_success(client):
    """Test successful resident registration."""
    payload = {
        "name": "Alice Resident",
        "email": "alice@society.com",
        "password": "Password123",
        "flat_no": "C-303",
        "phone_number": "9123456780",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    user = data["user"]
    assert user["name"] == "Alice Resident"
    assert user["email"] == "alice@society.com"
    assert user["role"] == "RESIDENT"
    assert user["flat_no"] == "C-303"
    assert "password" not in user
    assert "password_hash" not in user


def test_registration_ignores_role_escalation(client):
    """Test that role supplied during registration is ignored and set to RESIDENT."""
    payload = {
        "name": "Attacker",
        "email": "attacker@society.com",
        "password": "Password123",
        "role": "ADMIN",  # Ignored by schema/endpoint
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["user"]["role"] == "RESIDENT"


def test_duplicate_email_registration_rejected(client):
    """Test that registering duplicate emails returns 409 Conflict."""
    payload = {
        "name": "Bob Resident",
        "email": "bob@society.com",
        "password": "Password123",
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == status.HTTP_201_CREATED

    # Attempt with same email (and mixed case / spaces)
    payload2 = {
        "name": "Bob Duplicate",
        "email": "  BOB@society.com  ",
        "password": "Password456",
    }
    res2 = client.post("/api/auth/register", json=payload2)
    assert res2.status_code == status.HTTP_409_CONFLICT
    assert res2.json()["detail"] == "Email is already registered"


def test_registration_validation_errors(client):
    """Test registration with invalid payload formats."""
    # Short password (< 6 chars)
    res_short_pw = client.post(
        "/api/auth/register",
        json={"name": "Bob", "email": "bob2@society.com", "password": "123"},
    )
    assert res_short_pw.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid email
    res_invalid_email = client.post(
        "/api/auth/register",
        json={"name": "Bob", "email": "not-an-email", "password": "Password123"},
    )
    assert res_invalid_email.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_login_success(client):
    """Test login with valid email and password."""
    client.post(
        "/api/auth/register",
        json={"name": "Charlie", "email": "charlie@society.com", "password": "MySecretPassword1"},
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "charlie@society.com", "password": "MySecretPassword1"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "charlie@society.com"


def test_login_invalid_password(client):
    """Test login with incorrect password returns 401."""
    client.post(
        "/api/auth/register",
        json={"name": "Dave", "email": "dave@society.com", "password": "CorrectPassword"},
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "dave@society.com", "password": "WrongPassword"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unregistered_email(client):
    """Test login with non-existent email returns 401."""
    response = client.post(
        "/api/auth/login",
        json={"email": "ghost@society.com", "password": "SomePassword"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Invalid email or password"


def test_login_deactivated_user(client, db_session):
    """Test login with deactivated account returns 401."""
    deactivated = User(
        name="Deactivated",
        email="inactive@society.com",
        password_hash=hash_password("Password123"),
        role=UserRole.RESIDENT,
        is_active=False,
    )
    db_session.add(deactivated)
    db_session.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": "inactive@society.com", "password": "Password123"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "User account is deactivated"


def test_get_me_authenticated(client):
    """Test GET /api/auth/me with valid Bearer token."""
    reg = client.post(
        "/api/auth/register",
        json={"name": "Eve", "email": "eve@society.com", "password": "Password123", "flat_no": "E-505"},
    )
    token = reg.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Eve"
    assert data["email"] == "eve@society.com"
    assert data["flat_no"] == "E-505"
    assert data["role"] == "RESIDENT"


def test_get_me_missing_or_invalid_token(client):
    """Test GET /api/auth/me without token or invalid token."""
    # No auth header
    res_no_auth = client.get("/api/auth/me")
    assert res_no_auth.status_code == status.HTTP_401_UNAUTHORIZED

    # Invalid token string
    res_bad_token = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.garbage.token"},
    )
    assert res_bad_token.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_me_expired_token(client, db_session):
    """Test GET /api/auth/me with an expired token returns 401."""
    user = User(
        name="Frank",
        email="frank@society.com",
        password_hash=hash_password("Pass123"),
        role=UserRole.RESIDENT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    expired_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(hours=-1),
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_role_based_authorization_admin_vs_resident(client, db_session):
    """Test that require_admin permits ADMIN and forbids RESIDENT."""
    admin = User(
        name="Admin User",
        email="admin_rbac@society.com",
        password_hash=hash_password("AdminPass"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    resident = User(
        name="Resident User",
        email="resident_rbac@society.com",
        password_hash=hash_password("ResidentPass"),
        role=UserRole.RESIDENT,
        is_active=True,
    )
    db_session.add_all([admin, resident])
    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(resident)

    admin_token = create_access_token(admin.id)
    resident_token = create_access_token(resident.id)

    # Admin accesses admin-only endpoint -> 200 OK
    res_admin = client.get(
        "/api/test-rbac/admin-only",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin.status_code == status.HTTP_200_OK
    assert res_admin.json()["user_id"] == admin.id

    # Resident accesses admin-only endpoint -> 403 Forbidden
    res_resident = client.get(
        "/api/test-rbac/admin-only",
        headers={"Authorization": f"Bearer {resident_token}"},
    )
    assert res_resident.status_code == status.HTTP_403_FORBIDDEN
    assert res_resident.json()["detail"] == "Admin privileges required"

    # Both can access resident-allowed endpoint
    res_resident_allowed = client.get(
        "/api/test-rbac/resident-only",
        headers={"Authorization": f"Bearer {resident_token}"},
    )
    assert res_resident_allowed.status_code == status.HTTP_200_OK

    res_admin_on_resident = client.get(
        "/api/test-rbac/resident-only",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin_on_resident.status_code == status.HTTP_200_OK


def test_admin_login_returns_admin_role(client, db_session):
    """Test that authenticating as an admin returns the ADMIN role."""
    admin = User(
        name="Chief Admin",
        email="chief_admin@society.com",
        password_hash=hash_password("AdminSecret123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": "chief_admin@society.com", "password": "AdminSecret123"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["email"] == "chief_admin@society.com"


def test_resident_cannot_access_real_admin_endpoints(client, db_session):
    """Test that a resident token receives 403 Forbidden across all real admin endpoints."""
    resident = User(
        name="Regular Resident",
        email="regular_resident@society.com",
        password_hash=hash_password("ResidentPass123"),
        role=UserRole.RESIDENT,
        is_active=True,
    )
    db_session.add(resident)
    db_session.commit()

    token = create_access_token(resident.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Admin Dashboard
    res_dash = client.get("/api/admin/dashboard", headers=headers)
    assert res_dash.status_code == status.HTTP_403_FORBIDDEN
    assert res_dash.json()["detail"] == "Admin privileges required"

    # 2. Admin Complaints List
    res_comp = client.get("/api/admin/complaints", headers=headers)
    assert res_comp.status_code == status.HTTP_403_FORBIDDEN

    # 3. Admin Notice Creation
    res_notices = client.post(
        "/api/admin/notices",
        json={"title": "Hacked", "body": "Exploit attempt", "is_important": False},
        headers=headers,
    )
    assert res_notices.status_code == status.HTTP_403_FORBIDDEN

    # 4. Admin Settings
    res_settings = client.get("/api/admin/settings/overdue-threshold", headers=headers)
    assert res_settings.status_code == status.HTTP_403_FORBIDDEN


def test_admin_can_access_real_admin_endpoints(client, db_session):
    """Test that an admin token successfully accesses real admin endpoints."""
    admin = User(
        name="Super Admin",
        email="super_admin@society.com",
        password_hash=hash_password("SuperSecret123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    token = create_access_token(admin.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Admin Dashboard -> 200 OK
    res_dash = client.get("/api/admin/dashboard", headers=headers)
    assert res_dash.status_code == status.HTTP_200_OK

    # 2. Admin Complaints List -> 200 OK
    res_comp = client.get("/api/admin/complaints", headers=headers)
    assert res_comp.status_code == status.HTTP_200_OK

    # 3. Admin Settings -> 200 OK
    res_settings = client.get("/api/admin/settings/overdue-threshold", headers=headers)
    assert res_settings.status_code == status.HTTP_200_OK


def test_auth_me_returns_correct_role_for_resident_and_admin(client, db_session):
    """Test /api/auth/me returns accurate role for both resident and admin users."""
    resident = User(
        name="Resident Role Check",
        email="check_res@society.com",
        password_hash=hash_password("Pass123"),
        role=UserRole.RESIDENT,
        is_active=True,
    )
    admin = User(
        name="Admin Role Check",
        email="check_adm@society.com",
        password_hash=hash_password("Pass123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add_all([resident, admin])
    db_session.commit()

    res_me_resident = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {create_access_token(resident.id)}"},
    )
    assert res_me_resident.status_code == status.HTTP_200_OK
    assert res_me_resident.json()["role"] == "RESIDENT"

    res_me_admin = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {create_access_token(admin.id)}"},
    )
    assert res_me_admin.status_code == status.HTTP_200_OK
    assert res_me_admin.json()["role"] == "ADMIN"


def test_create_admin_script_idempotency_and_promotion(db_session, monkeypatch):
    """Test create_or_promote_admin idempotency, promotion of resident, and protection against downgrade."""
    from backend.app.scripts.create_admin import create_or_promote_admin

    # 1. Create a brand new admin user
    res1 = create_or_promote_admin(
        db=db_session,
        email="script_admin@society.com",
        password="AdminPass123",
        name="Script Admin",
        flat_no="Office-99",
    )
    assert res1["action"] == "created"
    assert res1["role"] == "ADMIN"

    # 2. Running again with same email is idempotent (noop)
    res2 = create_or_promote_admin(
        db=db_session,
        email="script_admin@society.com",
    )
    assert res2["action"] == "noop"
    assert res2["role"] == "ADMIN"

    # 3. Promote an existing resident to admin
    resident = User(
        name="Promotable Resident",
        email="promote_me@society.com",
        password_hash=hash_password("ResPass123"),
        role=UserRole.RESIDENT,
        is_active=True,
    )
    db_session.add(resident)
    db_session.commit()

    res3 = create_or_promote_admin(
        db=db_session,
        email="promote_me@society.com",
    )
    assert res3["action"] == "promoted"
    assert res3["role"] == "ADMIN"

    # Verify user in database is now ADMIN
    db_session.refresh(resident)
    assert resident.role == UserRole.ADMIN

    # 4. Production guardrail test: refuse to run when ENVIRONMENT=production without confirmation
    monkeypatch.setenv("ENVIRONMENT", "production")
    with pytest.raises(ValueError, match="Running in production environment requires explicit confirmation flag"):
        create_or_promote_admin(
            db=db_session,
            email="another_admin@society.com",
            password="Pass",
            confirm_production=False,
        )

    # 5. Production execution succeeds when confirm_production=True
    res5 = create_or_promote_admin(
        db=db_session,
        email="prod_admin@society.com",
        password="ProdPass123",
        confirm_production=True,
    )
    assert res5["action"] == "created"


def test_seed_demo_data_idempotency_and_dry_run(db_session, monkeypatch):
    """Test seed_demo_data in dry-run mode, initial execution, and idempotent re-execution."""
    from backend.app.scripts.seed import seed_demo_data, DEMO_ADMIN_EMAIL, DEMO_RESIDENT_EMAIL

    # 1. Dry run: verifies planned actions without DB commit
    dry_results = seed_demo_data(db=db_session, dry_run=True)
    assert any("[CREATE]" in u for u in dry_results["users"])
    assert any("[CREATE]" in c for c in dry_results["complaints"])
    assert any("[CREATE]" in n for n in dry_results["notices"])

    # Verify no records were actually committed during dry-run
    admin_check = db_session.scalars(select(User).where(User.email == DEMO_ADMIN_EMAIL)).first()
    assert admin_check is None

    # 2. Real Execution: creates demo accounts, sample complaints, and notices
    exec_results = seed_demo_data(db=db_session, dry_run=False)
    assert any("[CREATE]" in u for u in exec_results["users"])

    admin = db_session.scalars(select(User).where(User.email == DEMO_ADMIN_EMAIL)).first()
    resident = db_session.scalars(select(User).where(User.email == DEMO_RESIDENT_EMAIL)).first()
    assert admin is not None
    assert admin.role == UserRole.ADMIN
    assert resident is not None
    assert resident.role == UserRole.RESIDENT

    # 3. Idempotent Re-execution: reports [EXISTS] for all items
    re_exec_results = seed_demo_data(db=db_session, dry_run=False)
    assert all("[EXISTS]" in u for u in re_exec_results["users"])
    assert all("[EXISTS]" in c for c in re_exec_results["complaints"])
    assert all("[EXISTS]" in n for n in re_exec_results["notices"])


