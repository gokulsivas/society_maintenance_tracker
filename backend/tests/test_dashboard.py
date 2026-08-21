import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from fastapi import status

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.security import hash_password, create_access_token
from backend.app.models.enums import (
    UserRole,
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)
from backend.app.models.user import User
from backend.app.models.complaint import Complaint


@pytest.fixture
def dashboard_users(db_session):
    """Create test admin and resident users."""
    admin = User(
        name="Dashboard Admin",
        email="dash_admin@society.com",
        password_hash=hash_password("AdminPass123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    resident = User(
        name="Dashboard Resident",
        email="dash_resident@society.com",
        password_hash=hash_password("ResidentPass1"),
        role=UserRole.RESIDENT,
        flat_no="D-101",
        is_active=True,
    )
    db_session.add_all([admin, resident])
    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(resident)

    return {
        "admin": admin,
        "admin_token": create_access_token(admin.id),
        "resident": resident,
        "resident_token": create_access_token(resident.id),
    }


def test_resident_forbidden_from_dashboard_and_settings(client, dashboard_users):
    """Verify residents cannot access admin dashboard or overdue settings (403 Forbidden)."""
    res_dash = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {dashboard_users['resident_token']}"},
    )
    assert res_dash.status_code == status.HTTP_403_FORBIDDEN

    res_get_settings = client.get(
        "/api/admin/settings/overdue-threshold",
        headers={"Authorization": f"Bearer {dashboard_users['resident_token']}"},
    )
    assert res_get_settings.status_code == status.HTTP_403_FORBIDDEN

    res_patch_settings = client.patch(
        "/api/admin/settings/overdue-threshold",
        json={"overdue_threshold_days": 5},
        headers={"Authorization": f"Bearer {dashboard_users['resident_token']}"},
    )
    assert res_patch_settings.status_code == status.HTTP_403_FORBIDDEN


def test_dashboard_aggregate_totals(client, dashboard_users, db_session):
    """Verify aggregate counts for total, open, in_progress, and resolved complaints."""
    c_open = Complaint(
        title="Open Issue",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
    )
    c_prog = Complaint(
        title="Progress Issue",
        description="Desc",
        category=ComplaintCategory.ELECTRICAL,
        priority=ComplaintPriority.MEDIUM,
        status=ComplaintStatus.IN_PROGRESS,
        resident_id=dashboard_users["resident"].id,
    )
    c_res = Complaint(
        title="Resolved Issue",
        description="Desc",
        category=ComplaintCategory.CARPENTRY,
        priority=ComplaintPriority.LOW,
        status=ComplaintStatus.RESOLVED,
        resident_id=dashboard_users["resident"].id,
    )
    db_session.add_all([c_open, c_prog, c_res])
    db_session.commit()

    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_complaints"] == 3
    assert data["total_open"] == 1
    assert data["total_in_progress"] == 1
    assert data["total_resolved"] == 1


def test_dashboard_breakdowns_all_enums_present(client, dashboard_users, db_session):
    """Verify status, category, and priority breakdowns include all enum keys with accurate numbers."""
    c1 = Complaint(
        title="Plumbing High",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
    )
    c2 = Complaint(
        title="Plumbing Low",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.LOW,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()

    # Verify all categories present
    for cat in ComplaintCategory:
        assert cat.value in data["by_category"]
    assert data["by_category"]["PLUMBING"] == 2
    assert data["by_category"]["ELECTRICAL"] == 0

    # Verify all statuses present
    for st in ComplaintStatus:
        assert st.value in data["by_status"]
    assert data["by_status"]["OPEN"] == 2
    assert data["by_status"]["RESOLVED"] == 0

    # Verify all priorities present
    for prio in ComplaintPriority:
        assert prio.value in data["by_priority"]
    assert data["by_priority"]["HIGH"] == 1
    assert data["by_priority"]["LOW"] == 1
    assert data["by_priority"]["MEDIUM"] == 0


def test_dashboard_live_overdue_count(client, dashboard_users, db_session):
    """Verify live overdue count using configured threshold setting (default 3 days)."""
    now = datetime.now(timezone.utc)

    # 1. Overdue (open, 5 days old)
    c_overdue = Complaint(
        title="Overdue Leak",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
        created_at=now - timedelta(days=5),
    )
    # 2. Not overdue (open, 1 day old)
    c_fresh = Complaint(
        title="Fresh Leak",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
        created_at=now - timedelta(days=1),
    )
    # 3. Not overdue (resolved, 5 days old)
    c_resolved = Complaint(
        title="Resolved Leak",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.RESOLVED,
        resident_id=dashboard_users["resident"].id,
        created_at=now - timedelta(days=5),
        resolved_at=now - timedelta(days=2),
    )
    db_session.add_all([c_overdue, c_fresh, c_resolved])
    db_session.commit()

    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["total_overdue"] == 1


def test_dashboard_date_range_filtering(client, dashboard_users, db_session):
    """Verify from_date and to_date filters apply consistently to totals and breakdowns."""
    now = datetime.now(timezone.utc)

    # 1. Inside window (2 days ago)
    c_in = Complaint(
        title="Inside Window",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
        created_at=now - timedelta(days=2),
    )
    # 2. Outside window (10 days ago)
    c_out = Complaint(
        title="Outside Window",
        description="Desc",
        category=ComplaintCategory.ELECTRICAL,
        priority=ComplaintPriority.LOW,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
        created_at=now - timedelta(days=10),
    )
    db_session.add_all([c_in, c_out])
    db_session.commit()

    from_iso = (now - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    to_iso = (now - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

    res = client.get(
        f"/api/admin/dashboard?from_date={from_iso}&to_date={to_iso}",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_complaints"] == 1
    assert data["by_category"]["PLUMBING"] == 1
    assert data["by_category"]["ELECTRICAL"] == 0
    assert len(data["recent_complaints"]) == 1
    assert data["recent_complaints"][0]["title"] == "Inside Window"


def test_dashboard_invalid_date_range(client, dashboard_users):
    """Verify from_date > to_date returns 400 Bad Request."""
    from_iso = "2026-08-25T00:00:00Z"
    to_iso = "2026-08-20T00:00:00Z"

    res = client.get(
        f"/api/admin/dashboard?from_date={from_iso}&to_date={to_iso}",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "from_date cannot be after to_date" in res.json()["detail"]


def test_dashboard_recent_items_limit(client, dashboard_users, db_session):
    """Verify recent_limit caps the number of items returned in recent lists."""
    for i in range(8):
        db_session.add(
            Complaint(
                title=f"Complaint {i}",
                description=f"Desc {i}",
                category=ComplaintCategory.PLUMBING,
                priority=ComplaintPriority.MEDIUM,
                status=ComplaintStatus.OPEN,
                resident_id=dashboard_users["resident"].id,
            )
        )
    db_session.commit()

    res = client.get(
        "/api/admin/dashboard?recent_limit=3",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_complaints"] == 8
    assert len(data["recent_complaints"]) == 3


def test_admin_read_and_update_overdue_threshold(client, dashboard_users):
    """Verify admin can read and update the overdue threshold setting."""
    # Read default
    res_get = client.get(
        "/api/admin/settings/overdue-threshold",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res_get.status_code == status.HTTP_200_OK
    assert res_get.json()["overdue_threshold_days"] == 3

    # Update to 7 days
    res_patch = client.patch(
        "/api/admin/settings/overdue-threshold",
        json={"overdue_threshold_days": 7},
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res_patch.status_code == status.HTTP_200_OK
    assert res_patch.json()["overdue_threshold_days"] == 7

    # Verify read reflects new value
    res_get2 = client.get(
        "/api/admin/settings/overdue-threshold",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res_get2.json()["overdue_threshold_days"] == 7


def test_invalid_threshold_values_rejected(client, dashboard_users):
    """Verify threshold values outside 1-365 are rejected with 422."""
    # Value < 1
    res_zero = client.patch(
        "/api/admin/settings/overdue-threshold",
        json={"overdue_threshold_days": 0},
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res_zero.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Value > 365
    res_large = client.patch(
        "/api/admin/settings/overdue-threshold",
        json={"overdue_threshold_days": 500},
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res_large.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_threshold_update_dynamically_changes_overdue_count(client, dashboard_users, db_session):
    """Verify changing threshold dynamically updates overdue counts in the dashboard."""
    now = datetime.now(timezone.utc)

    # Complaint created 5 days ago
    c = Complaint(
        title="5-Day-Old Issue",
        description="Desc",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.MEDIUM,
        status=ComplaintStatus.OPEN,
        resident_id=dashboard_users["resident"].id,
        created_at=now - timedelta(days=5),
    )
    db_session.add(c)
    db_session.commit()

    # At threshold = 3, complaint is overdue
    res_dash1 = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res_dash1.json()["total_overdue"] == 1

    # Update threshold to 10 days
    client.patch(
        "/api/admin/settings/overdue-threshold",
        json={"overdue_threshold_days": 10},
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )

    # At threshold = 10, complaint is no longer overdue
    res_dash2 = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {dashboard_users['admin_token']}"},
    )
    assert res_dash2.json()["total_overdue"] == 0
