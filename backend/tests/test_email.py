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


def test_send_brevo_email_returns_false_and_logs_safe_message_when_unconfigured(monkeypatch, caplog):
    """Verify send_brevo_email logs a safe message without secrets and makes no network calls when unconfigured."""
    import logging
    from backend.app.core.email import send_brevo_email

    # Case 1: Both unconfigured
    monkeypatch.setattr(settings, "BREVO_API_KEY", None)
    monkeypatch.setattr(settings, "EMAIL_FROM", None)

    with caplog.at_level(logging.INFO), patch("httpx.Client") as mock_client:
        result = send_brevo_email(
            to_recipients=[{"email": "resident@example.com", "name": "Resident"}],
            subject="Test Subject",
            html_content="<p>Test</p>",
            text_content="Test",
        )
        assert result is False
        assert not mock_client.called
        assert "Email notifications are disabled because email configuration is missing." in caplog.text

    # Case 2: Only BREVO_API_KEY set, EMAIL_FROM missing
    caplog.clear()
    monkeypatch.setattr(settings, "BREVO_API_KEY", "xkeysib-some-key")
    monkeypatch.setattr(settings, "EMAIL_FROM", None)

    with caplog.at_level(logging.INFO), patch("httpx.Client") as mock_client:
        result = send_brevo_email(
            to_recipients=[{"email": "resident@example.com", "name": "Resident"}],
            subject="Test Subject",
            html_content="<p>Test</p>",
            text_content="Test",
        )
        assert result is False
        assert not mock_client.called
        assert "Email notifications are disabled because email configuration is missing." in caplog.text

    # Case 3: Only EMAIL_FROM set, BREVO_API_KEY missing
    caplog.clear()
    monkeypatch.setattr(settings, "BREVO_API_KEY", None)
    monkeypatch.setattr(settings, "EMAIL_FROM", "test@example.com")

    with caplog.at_level(logging.INFO), patch("httpx.Client") as mock_client:
        result = send_brevo_email(
            to_recipients=[{"email": "resident@example.com", "name": "Resident"}],
            subject="Test Subject",
            html_content="<p>Test</p>",
            text_content="Test",
        )
        assert result is False
        assert not mock_client.called
        assert "Email notifications are disabled because email configuration is missing." in caplog.text


def test_registration_sends_welcome_email_when_configured(client, email_setup):
    """Test 1: Successful registration creates the account and sends one welcome email when configured."""
    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        payload = {
            "name": "Grace Hopper",
            "email": "grace@society.com",
            "password": "Password123",
            "flat_no": "D-404",
        }
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == status.HTTP_201_CREATED
        assert mock_send.called
        assert mock_send.call_count == 1

        args, _ = mock_send.call_args
        recipients = args[0]
        subject = args[1]
        html_content = args[2]
        text_content = args[3]

        assert recipients == [{"email": "grace@society.com", "name": "Grace Hopper"}]
        assert subject == "Welcome to Socivio"
        assert "Grace Hopper" in html_content
        assert "account has been created successfully" in html_content
        assert "https://society.example.com" in html_content
        assert "This is a transactional email from Socivio." in html_content
        assert "Grace Hopper" in text_content


def test_registration_skips_welcome_email_when_brevo_key_missing(client, email_setup, monkeypatch):
    """Test 2: Registration succeeds and no external email request is made when BREVO_API_KEY is missing."""
    monkeypatch.setattr(settings, "BREVO_API_KEY", None)

    with patch("backend.app.core.email.send_brevo_email", wraps=None) as mock_send, patch("httpx.Client") as mock_http:
        payload = {
            "name": "No Key Resident",
            "email": "nokey@society.com",
            "password": "Password123",
        }
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == status.HTTP_201_CREATED
        assert not mock_http.called


def test_registration_skips_welcome_email_when_email_from_missing(client, email_setup, monkeypatch):
    """Test 3: Registration succeeds and no external email request is made when EMAIL_FROM is missing."""
    monkeypatch.setattr(settings, "EMAIL_FROM", None)

    with patch("backend.app.core.email.send_brevo_email", wraps=None) as mock_send, patch("httpx.Client") as mock_http:
        payload = {
            "name": "No From Resident",
            "email": "nofrom@society.com",
            "password": "Password123",
        }
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == status.HTTP_201_CREATED
        assert not mock_http.called


def test_duplicate_email_registration_does_not_send_welcome_email(client, email_setup):
    """Test 4: Duplicate email registration returns 409 and does NOT send a welcome email."""
    # First registration
    with patch("backend.app.core.email.send_brevo_email", return_value=True):
        client.post(
            "/api/auth/register",
            json={"name": "Dup User", "email": "dup@society.com", "password": "Password123"},
        )

    # Attempt duplicate registration
    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        res = client.post(
            "/api/auth/register",
            json={"name": "Dup User 2", "email": "dup@society.com", "password": "Password123"},
        )
        assert res.status_code == status.HTTP_409_CONFLICT
        assert not mock_send.called


def test_invalid_email_registration_does_not_send_welcome_email(client, email_setup):
    """Test 5: Invalid email registration returns 422 and does NOT send a welcome email."""
    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        res = client.post(
            "/api/auth/register",
            json={"name": "Invalid Email", "email": "not-a-valid-email", "password": "Password123"},
        )
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert not mock_send.called


def test_failed_db_registration_does_not_send_welcome_email(client, email_setup):
    """Test 6: Database failure during registration does NOT send a welcome email."""
    with patch("sqlalchemy.orm.Session.commit", side_effect=Exception("DB connection dropped")), \
         patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        with pytest.raises(Exception):
            client.post(
                "/api/auth/register",
                json={"name": "Fail DB", "email": "faildb@society.com", "password": "Password123"},
            )
        assert not mock_send.called


def test_brevo_failure_does_not_rollback_or_fail_registration(client, email_setup, db_session):
    """Test 7: Brevo failure does NOT roll back the account or fail the registration response."""
    with patch("backend.app.core.email.send_brevo_email", side_effect=Exception("Brevo Network Error")):
        payload = {
            "name": "Resilient Resident",
            "email": "resilient@society.com",
            "password": "Password123",
            "flat_no": "R-101",
        }
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json()
        assert data["user"]["email"] == "resilient@society.com"

        # Verify user was successfully committed to database
        db_session.expire_all()
        user_in_db = db_session.query(User).filter_by(email="resilient@society.com").first()
        assert user_in_db is not None
        assert user_in_db.name == "Resilient Resident"


def test_welcome_email_recipient_matches_registered_user(client, email_setup):
    """Test 8: The recipient is exactly the newly registered user's email."""
    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        client.post(
            "/api/auth/register",
            json={"name": "Target User", "email": "target_user@society.com", "password": "Password123"},
        )
        assert mock_send.called
        args, _ = mock_send.call_args
        recipients = args[0]
        assert len(recipients) == 1
        assert recipients[0]["email"] == "target_user@society.com"
        assert recipients[0]["name"] == "Target User"


def test_welcome_email_html_escaping_prevents_xss(client, email_setup):
    """Test 9: Dynamic name and values are safely escaped in HTML email content."""
    with patch("backend.app.core.email.send_brevo_email", return_value=True) as mock_send:
        client.post(
            "/api/auth/register",
            json={
                "name": "<script>alert('xss')</script> Hacker",
                "email": "hacker@society.com",
                "password": "Password123",
            },
        )
        assert mock_send.called
        args, _ = mock_send.call_args
        html_content = args[2]

        assert "<script>" not in html_content
        assert "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt; Hacker" in html_content

