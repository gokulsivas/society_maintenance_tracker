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
from backend.app.models.enums import (
    UserRole,
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
)
from backend.app.models.user import User
from backend.app.models.complaint import Complaint, ComplaintStatusHistory


@pytest.fixture
def users_fixture(db_session):
    """Create test users (Admin, Resident 1, Resident 2) and return tokens."""
    admin = User(
        name="Admin User",
        email="admin@society.com",
        password_hash=hash_password("AdminPass123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    res1 = User(
        name="Resident One",
        email="res1@society.com",
        password_hash=hash_password("ResidentPass1"),
        role=UserRole.RESIDENT,
        flat_no="A-101",
        is_active=True,
    )
    res2 = User(
        name="Resident Two",
        email="res2@society.com",
        password_hash=hash_password("ResidentPass2"),
        role=UserRole.RESIDENT,
        flat_no="B-202",
        is_active=True,
    )
    db_session.add_all([admin, res1, res2])
    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(res1)
    db_session.refresh(res2)

    return {
        "admin": admin,
        "admin_token": create_access_token(admin.id),
        "res1": res1,
        "res1_token": create_access_token(res1.id),
        "res2": res2,
        "res2_token": create_access_token(res2.id),
    }


def test_resident_creates_complaint_and_initial_history(client, users_fixture, db_session):
    """Verify resident can create a complaint and initial history row is inserted atomically."""
    payload = {
        "title": "Kitchen Sink Pipe Leaking",
        "category": "PLUMBING",
        "description": "Water leaking continuously from sink pipe",
        "photo_url": "https://res.cloudinary.com/demo/image/sample.jpg",
    }
    response = client.post(
        "/api/complaints",
        json=payload,
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Kitchen Sink Pipe Leaking"
    assert data["category"] == "PLUMBING"
    assert data["priority"] == "MEDIUM"
    assert data["status"] == "OPEN"
    assert data["is_overdue"] is False
    assert data["resident_id"] == users_fixture["res1"].id
    assert data["resident_name"] == "Resident One"
    assert data["resident_flat_no"] == "A-101"

    # Verify history record in database
    history = db_session.query(ComplaintStatusHistory).filter_by(complaint_id=data["id"]).all()
    assert len(history) == 1
    assert history[0].from_status is None
    assert history[0].to_status == ComplaintStatus.OPEN
    assert history[0].changed_by == users_fixture["res1"].id


def test_resident_listing_own_complaints(client, users_fixture):
    """Verify residents can only view their own complaints in /my."""
    # Resident 1 creates 2 complaints
    client.post(
        "/api/complaints",
        json={"title": "R1 Complaint 1", "category": "PLUMBING", "description": "Desc 1"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    client.post(
        "/api/complaints",
        json={"title": "R1 Complaint 2", "category": "ELECTRICAL", "description": "Desc 2"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )

    # Resident 2 creates 1 complaint
    client.post(
        "/api/complaints",
        json={"title": "R2 Complaint", "category": "SECURITY", "description": "Desc 3"},
        headers={"Authorization": f"Bearer {users_fixture['res2_token']}"},
    )

    # Res 1 checks /my
    res1_list = client.get(
        "/api/complaints/my",
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert res1_list.status_code == status.HTTP_200_OK
    assert len(res1_list.json()) == 2
    assert all(c["resident_id"] == users_fixture["res1"].id for c in res1_list.json())

    # Res 2 checks /my
    res2_list = client.get(
        "/api/complaints/my",
        headers={"Authorization": f"Bearer {users_fixture['res2_token']}"},
    )
    assert res2_list.status_code == status.HTTP_200_OK
    assert len(res2_list.json()) == 1
    assert res2_list.json()[0]["resident_id"] == users_fixture["res2"].id


def test_resident_cannot_access_other_resident_complaint(client, users_fixture):
    """Verify resident cannot view another resident's complaint detail (403 Forbidden)."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Private Issue", "category": "CLEANLINESS", "description": "Secret description"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Resident 2 attempts to access it
    res = client.get(
        f"/api/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {users_fixture['res2_token']}"},
    )
    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert res.json()["detail"] == "You do not have permission to access this complaint"


def test_admin_can_access_any_complaint(client, users_fixture):
    """Verify admin can access any complaint detail and full history."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Resident Issue", "category": "CARPENTRY", "description": "Door latch broken"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    res = client.get(
        f"/api/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["id"] == complaint_id
    assert len(data["status_history"]) == 1


def test_admin_priority_update(client, users_fixture, db_session):
    """Verify admin can update complaint priority without inserting history row."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Elevator issue", "category": "OTHER", "description": "Elevator making noise"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Resident attempts priority update -> 403 Forbidden
    res_resident = client.patch(
        f"/api/admin/complaints/{complaint_id}/priority",
        json={"priority": "HIGH"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert res_resident.status_code == status.HTTP_403_FORBIDDEN

    # Admin updates priority to HIGH
    res_admin = client.patch(
        f"/api/admin/complaints/{complaint_id}/priority",
        json={"priority": "HIGH"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_admin.status_code == status.HTTP_200_OK
    assert res_admin.json()["priority"] == "HIGH"

    # Verify status history count is still 1
    history_count = db_session.query(ComplaintStatusHistory).filter_by(complaint_id=complaint_id).count()
    assert history_count == 1


def test_admin_status_transition_lifecycle(client, users_fixture):
    """Verify status transition lifecycle OPEN -> IN_PROGRESS -> RESOLVED."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Power cut in hallway", "category": "ELECTRICAL", "description": "Corridor light blown"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Transition 1: OPEN -> IN_PROGRESS
    res_progress = client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS", "note": "Electrician dispatched"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_progress.status_code == status.HTTP_200_OK
    data1 = res_progress.json()
    assert data1["status"] == "IN_PROGRESS"
    assert len(data1["status_history"]) == 2
    assert data1["status_history"][1]["from_status"] == "OPEN"
    assert data1["status_history"][1]["to_status"] == "IN_PROGRESS"
    assert data1["status_history"][1]["note"] == "Electrician dispatched"

    # Transition 2: IN_PROGRESS -> RESOLVED
    res_resolved = client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "RESOLVED", "note": "Bulb replaced successfully"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_resolved.status_code == status.HTTP_200_OK
    data2 = res_resolved.json()
    assert data2["status"] == "RESOLVED"
    assert data2["resolved_at"] is not None
    assert len(data2["status_history"]) == 3
    assert data2["status_history"][2]["from_status"] == "IN_PROGRESS"
    assert data2["status_history"][2]["to_status"] == "RESOLVED"


def test_admin_status_transition_invalid_transitions(client, users_fixture):
    """Verify invalid status transitions return 409 Conflict."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Water issue", "category": "PLUMBING", "description": "Low pressure"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # OPEN -> OPEN is invalid
    res_same = client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "OPEN"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_same.status_code == status.HTTP_409_CONFLICT

    # Move to IN_PROGRESS
    client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )

    # IN_PROGRESS -> OPEN (backwards) is invalid
    res_backwards = client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "OPEN"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_backwards.status_code == status.HTTP_409_CONFLICT


def test_resolved_complaint_cannot_be_reopened(client, users_fixture):
    """Verify RESOLVED status is terminal and cannot be reopened (409 Conflict)."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Fix lock", "category": "CARPENTRY", "description": "Lock is stuck"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Directly resolve
    client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "RESOLVED", "note": "Fixed"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )

    # Attempt to reopen -> 409
    res_reopen = client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "OPEN", "note": "Reopening"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_reopen.status_code == status.HTTP_409_CONFLICT
    assert "terminal" in res_reopen.json()["detail"].lower()


def test_live_overdue_calculation_and_sorting(client, users_fixture, db_session):
    """Verify overdue calculation and that overdue complaints sort first, then priority, then oldest created."""
    now = datetime.now(timezone.utc)

    # 1. Overdue open complaint (created 5 days ago, threshold=3, priority LOW)
    c1 = Complaint(
        title="Old Overdue Complaint",
        description="Old leak",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.LOW,
        status=ComplaintStatus.OPEN,
        resident_id=users_fixture["res1"].id,
        created_at=now - timedelta(days=5),
    )
    # 2. Old resolved complaint (created 5 days ago, resolved, priority HIGH, not overdue)
    c2 = Complaint(
        title="Old Resolved Complaint",
        description="Resolved leak",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.RESOLVED,
        resident_id=users_fixture["res1"].id,
        created_at=now - timedelta(days=5),
        resolved_at=now - timedelta(days=2),
    )
    # 3. New open complaint (created 1 day ago, priority HIGH, not overdue)
    c3 = Complaint(
        title="New Complaint",
        description="New leak",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.HIGH,
        status=ComplaintStatus.OPEN,
        resident_id=users_fixture["res1"].id,
        created_at=now - timedelta(days=1),
    )
    db_session.add_all([c1, c2, c3])
    db_session.commit()

    # Admin lists all complaints
    res = client.get(
        "/api/admin/complaints",
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    items = res.json()["items"]
    assert len(items) == 3

    # 1st: Overdue complaint (c1) must be first even though its priority is LOW
    assert items[0]["title"] == "Old Overdue Complaint"
    assert items[0]["is_overdue"] is True

    # 2nd & 3rd: Both are priority HIGH; c2 was created 5 days ago (older), so c2 comes before c3 (created 1 day ago)
    assert items[1]["title"] == "Old Resolved Complaint"
    assert items[1]["is_overdue"] is False

    assert items[2]["title"] == "New Complaint"
    assert items[2]["is_overdue"] is False

    # Filter by is_overdue=true
    res_overdue_only = client.get(
        "/api/admin/complaints?is_overdue=true",
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_overdue_only.status_code == status.HTTP_200_OK
    assert res_overdue_only.json()["total"] == 1
    assert res_overdue_only.json()["items"][0]["title"] == "Old Overdue Complaint"


def test_admin_filters_and_pagination(client, users_fixture):
    """Verify admin complaints multi-criteria filtering and pagination."""
    # Create 5 complaints
    for i in range(5):
        client.post(
            "/api/complaints",
            json={
                "title": f"Complaint {i}",
                "category": "PLUMBING" if i < 3 else "ELECTRICAL",
                "description": f"Detailed description {i}",
            },
            headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
        )

    # Filter by category PLUMBING
    res_plumbing = client.get(
        "/api/admin/complaints?category=PLUMBING",
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_plumbing.status_code == status.HTTP_200_OK
    assert res_plumbing.json()["total"] == 3

    # Pagination: page=1, page_size=2
    res_p1 = client.get(
        "/api/admin/complaints?page=1&page_size=2",
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )
    assert res_p1.status_code == status.HTTP_200_OK
    data_p1 = res_p1.json()
    assert data_p1["total"] == 5
    assert len(data_p1["items"]) == 2
    assert data_p1["page"] == 1
    assert data_p1["total_pages"] == 3


def test_owner_edits_open_complaint_success(client, users_fixture, db_session):
    """Verify complaint owner can edit an OPEN complaint and update fields cleanly."""
    create_res = client.post(
        "/api/complaints",
        json={
            "title": "Old Title",
            "category": "PLUMBING",
            "description": "Original description of the issue",
            "photo_url": "https://res.cloudinary.com/demo/image/upload/v1/old.jpg",
        },
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert create_res.status_code == status.HTTP_201_CREATED
    complaint_id = create_res.json()["id"]
    original_created_at = create_res.json()["created_at"]
    original_updated_at = create_res.json()["updated_at"]

    # Owner edits complaint
    update_res = client.patch(
        f"/api/complaints/{complaint_id}",
        json={
            "title": "Updated Title After Inspection",
            "category": "CARPENTRY",
            "description": "Updated detailed description of the leak under woodwork",
            "photo_url": "https://res.cloudinary.com/demo/image/upload/v1/new.jpg",
        },
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert update_res.status_code == status.HTTP_200_OK
    data = update_res.json()
    assert data["title"] == "Updated Title After Inspection"
    assert data["category"] == "CARPENTRY"
    assert data["description"] == "Updated detailed description of the leak under woodwork"
    assert data["photo_url"] == "https://res.cloudinary.com/demo/image/upload/v1/new.jpg"
    assert data["status"] == "OPEN"
    assert data["priority"] == "MEDIUM"
    assert data["resident_id"] == users_fixture["res1"].id
    assert data["created_at"] == original_created_at
    assert data["updated_at"] >= original_updated_at


def test_owner_cannot_edit_in_progress_complaint(client, users_fixture):
    """Verify owner cannot edit a complaint that is IN_PROGRESS (409 Conflict)."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Drain issue", "category": "PLUMBING", "description": "Sink clogged"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Admin changes status to IN_PROGRESS
    client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS", "note": "Assigned technician"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )

    # Owner tries to edit -> 409 Conflict
    edit_res = client.patch(
        f"/api/complaints/{complaint_id}",
        json={"title": "Attempted Edit Title"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert edit_res.status_code == status.HTTP_409_CONFLICT
    assert "cannot edit" in edit_res.json()["detail"].lower()


def test_owner_cannot_edit_resolved_complaint(client, users_fixture):
    """Verify owner cannot edit a complaint that is RESOLVED (409 Conflict)."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Fuse blown", "category": "ELECTRICAL", "description": "No power in bedroom"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Admin marks as RESOLVED
    client.patch(
        f"/api/admin/complaints/{complaint_id}/status",
        json={"status": "RESOLVED", "note": "Fuse replaced"},
        headers={"Authorization": f"Bearer {users_fixture['admin_token']}"},
    )

    # Owner tries to edit -> 409 Conflict
    edit_res = client.patch(
        f"/api/complaints/{complaint_id}",
        json={"description": "Attempting to change description of resolved issue"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert edit_res.status_code == status.HTTP_409_CONFLICT
    assert "cannot edit" in edit_res.json()["detail"].lower()


def test_another_resident_cannot_edit_complaint(client, users_fixture):
    """Verify a different resident cannot edit another resident's complaint (403 Forbidden)."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Res 1 Complaint", "category": "SECURITY", "description": "Intercom broken"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Resident 2 attempts to edit Resident 1's complaint
    edit_res = client.patch(
        f"/api/complaints/{complaint_id}",
        json={"title": "Hacked Title"},
        headers={"Authorization": f"Bearer {users_fixture['res2_token']}"},
    )
    assert edit_res.status_code == status.HTTP_403_FORBIDDEN
    assert "permission" in edit_res.json()["detail"].lower()


def test_empty_complaint_update_rejected(client, users_fixture):
    """Verify empty update payloads ({}, null values only) are rejected with 422."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Window issue", "category": "CARPENTRY", "description": "Window latch loose"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # 1. Empty body {}
    res_empty = client.patch(
        f"/api/complaints/{complaint_id}",
        json={},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert res_empty.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 2. All null fields
    res_nulls = client.patch(
        f"/api/complaints/{complaint_id}",
        json={"title": None, "category": None, "description": None, "photo_url": None},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert res_nulls.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_invalid_photo_url_rejected_on_edit(client, users_fixture):
    """Verify invalid/malformed photo URLs are rejected with 422 on update."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Leak issue", "category": "PLUMBING", "description": "Pipe leaking"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Non-Cloudinary URL
    res_invalid = client.patch(
        f"/api/complaints/{complaint_id}",
        json={"photo_url": "https://malicious-site.com/fake.jpg"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert res_invalid.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # HTTP instead of HTTPS
    res_http = client.patch(
        f"/api/complaints/{complaint_id}",
        json={"photo_url": "http://res.cloudinary.com/demo/image/upload/sample.jpg"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert res_http.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_protected_fields_cannot_be_modified_on_edit(client, users_fixture, db_session):
    """Verify protected fields (resident_id, status, priority, created_at, resolved_at) cannot be modified via edit."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Light bulb out", "category": "ELECTRICAL", "description": "Need new bulb"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]
    original = create_res.json()

    # Attempt to pass protected fields in JSON
    res = client.patch(
        f"/api/complaints/{complaint_id}",
        json={
            "title": "Updated Light Bulb Title",
            "status": "RESOLVED",
            "priority": "HIGH",
            "resident_id": 999,
            "resolved_at": "2026-08-21T12:00:00Z",
        },
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["title"] == "Updated Light Bulb Title"
    # Protected fields must remain unchanged
    assert data["status"] == ComplaintStatus.OPEN
    assert data["priority"] == ComplaintPriority.MEDIUM
    assert data["resident_id"] == users_fixture["res1"].id
    assert data["resolved_at"] is None
    assert data["created_at"] == original["created_at"]


def test_status_history_remains_unchanged_on_edit(client, users_fixture, db_session):
    """Verify editing a complaint does not create or alter status history rows."""
    create_res = client.post(
        "/api/complaints",
        json={"title": "Staircase cleaning", "category": "CLEANLINESS", "description": "Leaves on staircase"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )
    complaint_id = create_res.json()["id"]

    # Verify initial history count is 1
    history_before = db_session.query(ComplaintStatusHistory).filter_by(complaint_id=complaint_id).all()
    assert len(history_before) == 1
    original_history_id = history_before[0].id

    # Perform edit
    client.patch(
        f"/api/complaints/{complaint_id}",
        json={"title": "Updated Staircase Cleaning Request", "description": "More leaves accumulated on stairs"},
        headers={"Authorization": f"Bearer {users_fixture['res1_token']}"},
    )

    # Verify history count is still strictly 1 and unchanged
    history_after = db_session.query(ComplaintStatusHistory).filter_by(complaint_id=complaint_id).all()
    assert len(history_after) == 1
    assert history_after[0].id == original_history_id
    assert history_after[0].to_status == ComplaintStatus.OPEN


def test_patch_complaint_openapi_contract(client):
    """API contract test: verify OpenAPI documentation for PATCH /api/complaints/{complaint_id}."""
    response = client.get("/api/openapi.json")
    assert response.status_code == status.HTTP_200_OK
    schema = response.json()
    paths = schema.get("paths", {})

    path_key = "/api/complaints/{complaint_id}"
    assert path_key in paths, f"Missing path {path_key} in OpenAPI spec"
    assert "patch" in paths[path_key], f"Missing patch operation for {path_key}"

    patch_op = paths[path_key]["patch"]
    responses = patch_op.get("responses", {})

    expected_responses = {
        "200": "successful update",
        "403": "authenticated user is not the complaint owner",
        "404": "complaint not found",
        "409": "complaint is not OPEN and cannot be edited",
        "422": "invalid or empty update payload",
    }

    for status_code, expected_desc in expected_responses.items():
        assert status_code in responses, f"Missing response status {status_code} in OpenAPI spec"
        actual_desc = responses[status_code].get("description", "").lower()
        assert expected_desc.lower() in actual_desc or actual_desc == expected_desc.lower(), (
            f"Response {status_code} description mismatch: expected '{expected_desc}', got '{actual_desc}'"
        )
