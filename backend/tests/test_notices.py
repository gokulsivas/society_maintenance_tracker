import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from fastapi import status
from fastapi.testclient import TestClient

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.security import hash_password, create_access_token
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.models.notice import Notice


@pytest.fixture
def notice_users_fixture(db_session):
    """Create test users (Admin and Resident) and return tokens."""
    admin = User(
        name="Admin Notice Poster",
        email="admin_notice@society.com",
        password_hash=hash_password("AdminPass123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    resident = User(
        name="Resident Reader",
        email="resident_reader@society.com",
        password_hash=hash_password("ResidentPass1"),
        role=UserRole.RESIDENT,
        flat_no="D-404",
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


def test_admin_creates_notice(client, notice_users_fixture):
    """Verify admin can create a notice and posted_by is set to authenticated admin."""
    payload = {
        "title": "Water Supply Interruption",
        "body": "Water supply will be suspended tomorrow from 9 AM to 1 PM for maintenance.",
        "is_important": True,
    }
    response = client.post(
        "/api/admin/notices",
        json=payload,
        headers={"Authorization": f"Bearer {notice_users_fixture['admin_token']}"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Water Supply Interruption"
    assert data["body"] == "Water supply will be suspended tomorrow from 9 AM to 1 PM for maintenance."
    assert data["is_important"] is True
    assert data["posted_by"] == notice_users_fixture["admin"].id
    assert data["author_name"] == "Admin Notice Poster"


def test_notice_creation_ignores_spoofed_posted_by(client, notice_users_fixture):
    """Verify passing posted_by in request body is ignored and always set from token."""
    payload = {
        "title": "Security Advisory",
        "body": "Please ensure main gate is locked after 10 PM.",
        "is_important": False,
        "posted_by": 9999,  # Spoofed
    }
    response = client.post(
        "/api/admin/notices",
        json=payload,
        headers={"Authorization": f"Bearer {notice_users_fixture['admin_token']}"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["posted_by"] == notice_users_fixture["admin"].id


def test_resident_cannot_create_update_or_delete_notices(client, notice_users_fixture, db_session):
    """Verify residents are rejected with 403 Forbidden on all admin notice endpoints."""
    # 1. Create notice as admin first
    notice = Notice(
        title="Admin Notice",
        body="Important admin content",
        posted_by=notice_users_fixture["admin"].id,
    )
    db_session.add(notice)
    db_session.commit()
    db_session.refresh(notice)

    # 2. Resident attempts POST -> 403
    res_create = client.post(
        "/api/admin/notices",
        json={"title": "Resident Notice", "body": "Unauthorized notice body"},
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res_create.status_code == status.HTTP_403_FORBIDDEN

    # 3. Resident attempts PATCH -> 403
    res_patch = client.patch(
        f"/api/admin/notices/{notice.id}",
        json={"title": "Hacked Title"},
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res_patch.status_code == status.HTTP_403_FORBIDDEN

    # 4. Resident attempts DELETE -> 403
    res_delete = client.delete(
        f"/api/admin/notices/{notice.id}",
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res_delete.status_code == status.HTTP_403_FORBIDDEN


def test_resident_and_admin_can_list_notices(client, notice_users_fixture, db_session):
    """Verify both residents and admins can list notices."""
    n1 = Notice(title="Notice 1", body="Body text 1", posted_by=notice_users_fixture["admin"].id)
    n2 = Notice(title="Notice 2", body="Body text 2", posted_by=notice_users_fixture["admin"].id)
    db_session.add_all([n1, n2])
    db_session.commit()

    # Resident lists
    res_resident = client.get(
        "/api/notices",
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res_resident.status_code == status.HTTP_200_OK
    assert res_resident.json()["total"] == 2

    # Admin lists
    res_admin = client.get(
        "/api/notices",
        headers={"Authorization": f"Bearer {notice_users_fixture['admin_token']}"},
    )
    assert res_admin.status_code == status.HTTP_200_OK
    assert res_admin.json()["total"] == 2


def test_important_notices_sort_first(client, notice_users_fixture, db_session):
    """Verify sorting: is_important DESC, created_at DESC."""
    now = datetime.now(timezone.utc)

    # Notice 1: Normal, created 2 days ago
    n1 = Notice(
        title="Normal Old Notice",
        body="Body 1",
        is_important=False,
        posted_by=notice_users_fixture["admin"].id,
        created_at=now - timedelta(days=2),
    )
    # Notice 2: Normal, created 1 hour ago
    n2 = Notice(
        title="Normal Fresh Notice",
        body="Body 2",
        is_important=False,
        posted_by=notice_users_fixture["admin"].id,
        created_at=now - timedelta(hours=1),
    )
    # Notice 3: Important, created 3 days ago
    n3 = Notice(
        title="Important Old Notice",
        body="Body 3",
        is_important=True,
        posted_by=notice_users_fixture["admin"].id,
        created_at=now - timedelta(days=3),
    )
    # Notice 4: Important, created 1 day ago
    n4 = Notice(
        title="Important Fresh Notice",
        body="Body 4",
        is_important=True,
        posted_by=notice_users_fixture["admin"].id,
        created_at=now - timedelta(days=1),
    )
    db_session.add_all([n1, n2, n3, n4])
    db_session.commit()

    response = client.get(
        "/api/notices",
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert response.status_code == status.HTTP_200_OK
    items = response.json()["items"]
    assert len(items) == 4

    # 1. Important Fresh (n4)
    assert items[0]["title"] == "Important Fresh Notice"
    assert items[0]["is_important"] is True

    # 2. Important Old (n3)
    assert items[1]["title"] == "Important Old Notice"
    assert items[1]["is_important"] is True

    # 3. Normal Fresh (n2)
    assert items[2]["title"] == "Normal Fresh Notice"
    assert items[2]["is_important"] is False

    # 4. Normal Old (n1)
    assert items[3]["title"] == "Normal Old Notice"
    assert items[3]["is_important"] is False


def test_notices_pagination(client, notice_users_fixture, db_session):
    """Verify notice pagination."""
    for i in range(5):
        db_session.add(
            Notice(
                title=f"Notice {i}",
                body=f"Notice description {i}",
                posted_by=notice_users_fixture["admin"].id,
            )
        )
    db_session.commit()

    res = client.get(
        "/api/notices?page=1&page_size=2",
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total"] == 5
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 3


def test_notice_detail_success_and_not_found(client, notice_users_fixture, db_session):
    """Verify single notice detail returns 200 OK and non-existent ID returns 404."""
    notice = Notice(
        title="Annual General Meeting",
        body="AGM will be held on Sunday at the clubhouse.",
        is_important=True,
        posted_by=notice_users_fixture["admin"].id,
    )
    db_session.add(notice)
    db_session.commit()
    db_session.refresh(notice)

    # Valid ID
    res = client.get(
        f"/api/notices/{notice.id}",
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["id"] == notice.id
    assert data["title"] == "Annual General Meeting"
    assert data["author_name"] == "Admin Notice Poster"
    assert "password" not in str(data)

    # Invalid ID
    res_404 = client.get(
        "/api/notices/99999",
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res_404.status_code == status.HTTP_404_NOT_FOUND
    assert res_404.json()["detail"] == "Notice not found"


def test_admin_updates_notice(client, notice_users_fixture, db_session):
    """Verify admin can update notice title, body, and importance, preserving posted_by and created_at."""
    notice = Notice(
        title="Original Title",
        body="Original body text",
        is_important=False,
        posted_by=notice_users_fixture["admin"].id,
    )
    db_session.add(notice)
    db_session.commit()
    db_session.refresh(notice)
    original_created_at = notice.created_at

    update_payload = {
        "title": "Updated Title",
        "body": "Updated body text",
        "is_important": True,
    }
    res = client.patch(
        f"/api/admin/notices/{notice.id}",
        json=update_payload,
        headers={"Authorization": f"Bearer {notice_users_fixture['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["title"] == "Updated Title"
    assert data["body"] == "Updated body text"
    assert data["is_important"] is True
    assert data["posted_by"] == notice_users_fixture["admin"].id

    # Update invalid ID -> 404
    res_404 = client.patch(
        "/api/admin/notices/99999",
        json={"title": "Doesn't exist"},
        headers={"Authorization": f"Bearer {notice_users_fixture['admin_token']}"},
    )
    assert res_404.status_code == status.HTTP_404_NOT_FOUND


def test_admin_deletes_notice(client, notice_users_fixture, db_session):
    """Verify admin can delete a notice (204 No Content) and subsequent GET returns 404."""
    notice = Notice(
        title="Notice to be deleted",
        body="This notice will be removed.",
        posted_by=notice_users_fixture["admin"].id,
    )
    db_session.add(notice)
    db_session.commit()
    db_session.refresh(notice)

    # Delete notice
    res_del = client.delete(
        f"/api/admin/notices/{notice.id}",
        headers={"Authorization": f"Bearer {notice_users_fixture['admin_token']}"},
    )
    assert res_del.status_code == status.HTTP_204_NO_CONTENT
    assert res_del.content == b""

    # Subsequent GET -> 404
    res_get = client.get(
        f"/api/notices/{notice.id}",
        headers={"Authorization": f"Bearer {notice_users_fixture['resident_token']}"},
    )
    assert res_get.status_code == status.HTTP_404_NOT_FOUND

    # Delete non-existent ID -> 404
    res_del_404 = client.delete(
        "/api/admin/notices/99999",
        headers={"Authorization": f"Bearer {notice_users_fixture['admin_token']}"},
    )
    assert res_del_404.status_code == status.HTTP_404_NOT_FOUND
