import html
import logging
from typing import List, Optional
import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
BATCH_SIZE = 50  # Bounded recipient batch size for email delivery


def send_brevo_email(
    to_recipients: List[dict],
    subject: str,
    html_content: str,
    text_content: str,
) -> bool:
    """Send an email using Brevo's HTTP REST API.

    Guarantees no secret leaks in logs and never raises uncaught exceptions.
    """
    if not settings.is_brevo_configured:
        logger.info("Brevo email API is not configured. Skipping email dispatch.")
        return False

    if not to_recipients:
        return False

    payload = {
        "sender": {
            "name": settings.EMAIL_FROM_NAME,
            "email": settings.EMAIL_FROM,
        },
        "to": to_recipients,
        "subject": subject,
        "htmlContent": html_content,
        "textContent": text_content,
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": settings.BREVO_API_KEY,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(BREVO_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            logger.info("Brevo email dispatched successfully to %d recipient(s).", len(to_recipients))
            return True
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Brevo API error: HTTP status %d returned for %d recipient(s).",
            exc.response.status_code if exc.response else 0,
            len(to_recipients),
        )
        return False
    except Exception as exc:
        logger.error(
            "Brevo network/connection error: %s occurred while sending to %d recipient(s).",
            type(exc).__name__,
            len(to_recipients),
        )
        return False


def send_complaint_status_email(
    resident_email: str,
    resident_name: Optional[str],
    complaint_id: int,
    complaint_title: str,
    from_status: str,
    to_status: str,
    note: Optional[str] = None,
) -> bool:
    """Dispatch status transition notification to the complaint owner."""
    if not resident_email:
        return False

    # Safely escape HTML inputs
    safe_name = html.escape(resident_name or "Resident")
    safe_title = html.escape(complaint_title)
    safe_from = html.escape(from_status)
    safe_to = html.escape(to_status)
    safe_note = html.escape(note) if note else None

    base_url = settings.FRONTEND_URL.rstrip("/")
    complaint_url = f"{base_url}/complaints/{complaint_id}"
    safe_url = html.escape(complaint_url)

    subject = f"[Society Maintenance] Status Update on Complaint #{complaint_id}: {complaint_title}"

    note_html = f"<p><strong>Admin Note:</strong> {safe_note}</p>" if safe_note else ""
    note_text = f"\nAdmin Note: {note}" if note else ""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Complaint Status Updated</h2>
        <p>Hello {safe_name},</p>
        <p>Your complaint <strong>{safe_title}</strong> (ID #{complaint_id}) has been updated:</p>
        <p style="font-size: 16px;">
            Status: <span style="color: #666;">{safe_from}</span> &rarr; <strong style="color: #2563eb;">{safe_to}</strong>
        </p>
        {note_html}
        <p style="margin-top: 20px;">
            <a href="{safe_url}" style="background-color: #2563eb; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px;">
                View Complaint Details
            </a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
            Society Maintenance Tracker &bull; Automated Notification
        </p>
    </div>
    """

    text_content = f"""Complaint Status Updated

Hello {resident_name or 'Resident'},

Your complaint '{complaint_title}' (ID #{complaint_id}) has been updated:
Status: {from_status} -> {to_status}{note_text}

View details: {complaint_url}

Society Maintenance Tracker
"""

    recipient = [{"email": resident_email, "name": resident_name or "Resident"}]
    return send_brevo_email(recipient, subject, html_content, text_content)


def send_important_notice_broadcast(
    recipients: List[dict],
    notice_title: str,
    notice_body: str,
    notice_id: int,
) -> int:
    """Broadcast important notice to active residents in bounded batches."""
    if not recipients:
        return 0

    safe_title = html.escape(notice_title)
    safe_body = html.escape(notice_body).replace("\n", "<br>")

    base_url = settings.FRONTEND_URL.rstrip("/")
    notices_url = f"{base_url}/notices"
    safe_url = html.escape(notices_url)

    subject = f"[Important Notice] {notice_title}"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #dc2626;">Important Society Announcement</h2>
        <h3>{safe_title}</h3>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0;">
            {safe_body}
        </div>
        <p style="margin-top: 20px;">
            <a href="{safe_url}" style="background-color: #dc2626; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px;">
                View Notice Board
            </a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
            Society Maintenance Tracker &bull; Broadcast Notification
        </p>
    </div>
    """

    text_content = f"""Important Society Announcement: {notice_title}

{notice_body}

View on Notice Board: {notices_url}

Society Maintenance Tracker
"""

    sent_count = 0
    # Process in bounded batches of 50 to prevent huge single payload memory issues
    for i in range(0, len(recipients), BATCH_SIZE):
        batch = recipients[i : i + BATCH_SIZE]
        if send_brevo_email(batch, subject, html_content, text_content):
            sent_count += len(batch)

    return sent_count
