import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest
from fastapi import status

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings
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
def email_setup(db_session, monkeypatch):
    """Setup test users and mock Brevo settings."""
    monkeypatch.setattr(settings, "BREVO_API_KEY", "xkeysib-mock-api-key-987654321")
    monkeypatch.setattr(settings, "EMAIL_FROM", "test@society.com")
    monkeypatch.setattr(settings, "EMAIL_FROM_NAME", "Society Support")
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://society.example.com")

    admin = User(
        name="Admin Boss",
        email="admin_boss@society.com",
        password_hash=hash_password("AdminPass123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    res1 = User(
        name="Resident One",
        email="res1_email@society.com",
        password_hash=hash_password("ResPass1"),
        role=UserRole.RESIDENT,
        flat_no="E-101",
        is_active=True,
    )
    res2 = User(
        name="Resident Two",
        email="res2_email@society.com",
        password_hash=hash_password("ResPass2"),
        role=UserRole.RESIDENT,
        flat_no="E-102",
        is_active=True,
    )
    res_inactive = User(
        name="Inactive Resident",
        email="inactive@society.com",
        password_hash=hash_password("ResPass3"),
        role=UserRole.RESIDENT,
        flat_no="E-103",
        is_active=False,
    )
    db_session.add_all([admin, res1, res2, res_inactive])
    db_session.commit()

    return {
        "admin": admin,
        "admin_token": create_access_token(admin.id),
        "res1": res1,
        "res1_token": create_access_token(res1.id),
        "res2": res2,
        "res_inactive": res_inactive,
    }


def test_status_transition_sends_brevo_email(client, email_setup, db_session):
    """Verify status transition triggers an email to the complaint resident with escaped details."""
    complaint = Complaint(
        title="Kitchen Tap Broken",
        description="Leaking heavily",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.MEDIUM,
        status=ComplaintStatus.OPEN,
        resident_id=email_setup["res1"].id,
    )
    db_session.add(complaint)
    db_session.commit()
    db_session.refresh(complaint)

    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        res = client.patch(
            f"/api/admin/complaints/{complaint.id}/status",
            json={"status": "IN_PROGRESS", "note": "Plumber dispatched to flat"},
            headers={"Authorization": f"Bearer {email_setup['admin_token']}"},
        )
        assert res.status_code == status.HTTP_200_OK
        assert mock_send.called
        assert mock_send.call_count == 1

        args, kwargs = mock_send.call_args
        recipients = args[0]
        subject = args[1]
        html_content = args[2]
        text_content = args[3]

        assert recipients == [{"email": "res1_email@society.com", "name": "Resident One"}]
        assert f"#{complaint.id}" in subject
        assert "OPEN" in html_content
        assert "IN_PROGRESS" in html_content
        assert "Plumber dispatched to flat" in html_content
        assert "https://society.example.com/complaints/" in html_content


def test_status_transition_resilient_to_brevo_failure(client, email_setup, db_session):
    """Verify DB commit succeeds and 200 OK is returned even when Brevo throws an exception."""
    complaint = Complaint(
        title="Light Out",
        description="Corridor light",
        category=ComplaintCategory.ELECTRICAL,
        priority=ComplaintPriority.LOW,
        status=ComplaintStatus.OPEN,
        resident_id=email_setup["res1"].id,
    )
    db_session.add(complaint)
    db_session.commit()
    db_session.refresh(complaint)

    with patch("backend.app.core.email.send_brevo_email", side_effect=Exception("Connection timed out")):
        res = client.patch(
            f"/api/admin/complaints/{complaint.id}/status",
            json={"status": "IN_PROGRESS", "note": "Electrician notified"},
            headers={"Authorization": f"Bearer {email_setup['admin_token']}"},
        )
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["status"] == "IN_PROGRESS"

        # Verify DB updated
        db_session.expire_all()
        db_complaint = db_session.query(Complaint).filter_by(id=complaint.id).first()
        assert db_complaint.status == ComplaintStatus.IN_PROGRESS


def test_important_notice_broadcasts_to_active_residents(client, email_setup):
    """Verify important notice broadcasts to all active residents in bounded batches."""
    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        res = client.post(
            "/api/admin/notices",
            json={
                "title": "Emergency Generator Test",
                "body": "Power will fluctuate between 2 PM and 4 PM.",
                "is_important": True,
            },
            headers={"Authorization": f"Bearer {email_setup['admin_token']}"},
        )
        assert res.status_code == status.HTTP_201_CREATED
        assert mock_send.called

        # Should send to res1 and res2 (active residents), but not inactive resident
        args, _ = mock_send.call_args
        recipients = args[0]
        recipient_emails = [r["email"] for r in recipients]
        assert "res1_email@society.com" in recipient_emails
        assert "res2_email@society.com" in recipient_emails
        assert "inactive@society.com" not in recipient_emails


def test_non_important_notice_sends_no_emails(client, email_setup):
    """Verify ordinary non-important notice triggers zero emails."""
    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        res = client.post(
            "/api/admin/notices",
            json={
                "title": "Clubhouse Booking Info",
                "body": "Clubhouse open for bookings next month.",
                "is_important": False,
            },
            headers={"Authorization": f"Bearer {email_setup['admin_token']}"},
        )
        assert res.status_code == status.HTTP_201_CREATED
        assert not mock_send.called


def test_important_notice_resilient_to_brevo_failure(client, email_setup):
    """Verify notice is created (201 Created) even if Brevo broadcast fails."""
    with patch("backend.app.core.email.send_brevo_email", side_effect=Exception("Brevo API 500")):
        res = client.post(
            "/api/admin/notices",
            json={
                "title": "Lift Maintenance",
                "body": "Lift 2 under maintenance.",
                "is_important": True,
            },
            headers={"Authorization": f"Bearer {email_setup['admin_token']}"},
        )
        assert res.status_code == status.HTTP_201_CREATED
        assert res.json()["title"] == "Lift Maintenance"


def test_unconfigured_brevo_handled_gracefully(client, email_setup, db_session, monkeypatch):
    """Verify missing Brevo API key is handled gracefully without errors."""
    monkeypatch.setattr(settings, "BREVO_API_KEY", None)

    complaint = Complaint(
        title="Door Hinge",
        description="Loose hinge",
        category=ComplaintCategory.CARPENTRY,
        priority=ComplaintPriority.LOW,
        status=ComplaintStatus.OPEN,
        resident_id=email_setup["res1"].id,
    )
    db_session.add(complaint)
    db_session.commit()

    # Status change with no Brevo API key configured
    res = client.patch(
        f"/api/admin/complaints/{complaint.id}/status",
        json={"status": "IN_PROGRESS"},
        headers={"Authorization": f"Bearer {email_setup['admin_token']}"},
    )
    assert res.status_code == status.HTTP_200_OK


def test_html_escaping_prevents_injection(client, email_setup, db_session):
    """Verify malicious HTML tags in titles and notes are safely escaped in generated email HTML."""
    complaint = Complaint(
        title="<script>alert('xss')</script> Leak",
        description="Testing injection",
        category=ComplaintCategory.PLUMBING,
        priority=ComplaintPriority.MEDIUM,
        status=ComplaintStatus.OPEN,
        resident_id=email_setup["res1"].id,
    )
    db_session.add(complaint)
    db_session.commit()

    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        client.patch(
            f"/api/admin/complaints/{complaint.id}/status",
            json={"status": "IN_PROGRESS", "note": "<img src=x onerror=alert('xss')>"},
            headers={"Authorization": f"Bearer {email_setup['admin_token']}"},
        )

        args, _ = mock_send.call_args
        html_content = args[2]

        # Must not contain unescaped tags
        assert "<script>" not in html_content
        assert "&lt;script&gt;" in html_content
        assert "<img" not in html_content
        assert "&lt;img" in html_content
