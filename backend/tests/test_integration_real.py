import io
import os
import pytest
from PIL import Image
from sqlalchemy import text
from backend.app.core.config import settings

RUN_REAL_SERVICES = os.getenv("RUN_REAL_SERVICE_TESTS", "").lower() in ("true", "1", "yes")
RUN_REAL_EMAILS = os.getenv("RUN_REAL_EMAIL_TESTS", "").lower() in ("true", "1", "yes")


@pytest.mark.skipif(not RUN_REAL_SERVICES, reason="Real-service integration tests disabled by default (opt-in via RUN_REAL_SERVICE_TESTS=true)")
def test_real_neon_database_connectivity():
    """Opt-in integration test: verify live Neon database query execution."""
    from backend.app.core.database import SessionLocal
    assert settings.DATABASE_URL, "DATABASE_URL must be configured"
    
    session = SessionLocal()
    try:
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1
    finally:
        session.close()


@pytest.mark.skipif(not RUN_REAL_SERVICES, reason="Real-service integration tests disabled by default (opt-in via RUN_REAL_SERVICE_TESTS=true)")
def test_real_cloudinary_upload_and_cleanup():
    """Opt-in integration test: test real upload to Cloudinary and immediate cleanup."""
    if not settings.is_cloudinary_configured:
        pytest.skip("Cloudinary credentials not configured")

    import cloudinary
    import cloudinary.uploader
    from backend.app.core.cloudinary import configure_cloudinary

    configure_cloudinary()

    # Generate in-memory 50x50 JPEG
    buf = io.BytesIO()
    img = Image.new("RGB", (50, 50), color="green")
    img.save(buf, format="JPEG")
    image_bytes = buf.getvalue()

    public_id = None
    try:
        upload_result = cloudinary.uploader.upload(
            image_bytes,
            folder=settings.CLOUDINARY_FOLDER,
            resource_type="image",
        )
        assert "secure_url" in upload_result
        assert "public_id" in upload_result
        public_id = upload_result["public_id"]
        assert upload_result["secure_url"].startswith("https://res.cloudinary.com/")
    finally:
        # Guarantee cleanup of uploaded test asset
        if public_id:
            try:
                cloudinary.uploader.destroy(public_id)
            except Exception:
                pass


@pytest.mark.skipif(not (RUN_REAL_SERVICES and RUN_REAL_EMAILS), reason="Real email tests disabled by default (opt-in via RUN_REAL_SERVICE_TESTS=true and RUN_REAL_EMAIL_TESTS=true)")
def test_real_brevo_email_dispatch():
    """Opt-in integration test: test live Brevo email dispatch if explicitly enabled."""
    if not settings.is_brevo_configured:
        pytest.skip("Brevo API key not configured")

    from backend.app.core.email import send_brevo_email
    
    test_recipient = os.getenv("TEST_EMAIL_RECIPIENT", settings.SEED_ADMIN_EMAIL)
    success = send_brevo_email(
        to_recipients=[{"email": test_recipient, "name": "Integration Test"}],
        subject="[Test] Real Brevo Dispatch Verification",
        html_content="<p>This is an automated opt-in integration test.</p>",
        text_content="This is an automated opt-in integration test.",
    )
    assert success is True
