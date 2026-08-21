import io
import sys
from pathlib import Path
from unittest.mock import patch
import pytest
from fastapi import status
from PIL import Image

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings
from backend.app.core.security import hash_password, create_access_token
from backend.app.models.enums import UserRole
from backend.app.models.user import User


def generate_test_image_bytes(format_name="JPEG", size=(100, 100), color="blue") -> bytes:
    """Generate real in-memory image bytes for testing."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format_name)
    return buf.getvalue()


@pytest.fixture
def upload_user(db_session):
    """Create test resident user."""
    resident = User(
        name="Upload Resident",
        email="upload_resident@society.com",
        password_hash=hash_password("ResidentPass123"),
        role=UserRole.RESIDENT,
        flat_no="U-101",
        is_active=True,
    )
    db_session.add(resident)
    db_session.commit()
    db_session.refresh(resident)

    return {
        "user": resident,
        "token": create_access_token(resident.id),
    }


@pytest.fixture(autouse=True)
def mock_cloudinary_settings(monkeypatch):
    """Ensure mock Cloudinary credentials are set for upload tests."""
    monkeypatch.setattr(settings, "CLOUDINARY_CLOUD_NAME", "testcloud")
    monkeypatch.setattr(settings, "CLOUDINARY_API_KEY", "123456789")
    monkeypatch.setattr(settings, "CLOUDINARY_API_SECRET", "test_secret_key")


def test_successful_jpeg_upload(client, upload_user):
    """Verify valid JPEG file is accepted and returns Cloudinary secure_url."""
    jpeg_bytes = generate_test_image_bytes("JPEG")

    mock_upload_response = {
        "secure_url": "https://res.cloudinary.com/testcloud/image/upload/v12345/society_complaints/comp1.jpg",
        "public_id": "society_complaints/comp1",
    }

    with patch("cloudinary.uploader.upload", return_value=mock_upload_response) as mock_upload:
        response = client.post(
            "/api/uploads/complaint-photo",
            files={"file": ("leak.jpg", jpeg_bytes, "image/jpeg")},
            headers={"Authorization": f"Bearer {upload_user['token']}"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["secure_url"] == mock_upload_response["secure_url"]
        assert data["public_id"] == mock_upload_response["public_id"]
        assert mock_upload.called


def test_successful_png_and_webp_upload(client, upload_user):
    """Verify PNG and WebP formats upload successfully."""
    mock_upload_response = {
        "secure_url": "https://res.cloudinary.com/testcloud/image/upload/v12345/society_complaints/sample.png",
        "public_id": "society_complaints/sample",
    }

    # PNG test
    png_bytes = generate_test_image_bytes("PNG")
    with patch("cloudinary.uploader.upload", return_value=mock_upload_response):
        res_png = client.post(
            "/api/uploads/complaint-photo",
            files={"file": ("leak.png", png_bytes, "image/png")},
            headers={"Authorization": f"Bearer {upload_user['token']}"},
        )
        assert res_png.status_code == status.HTTP_201_CREATED

    # WebP test
    webp_bytes = generate_test_image_bytes("WEBP")
    with patch("cloudinary.uploader.upload", return_value=mock_upload_response):
        res_webp = client.post(
            "/api/uploads/complaint-photo",
            files={"file": ("leak.webp", webp_bytes, "image/webp")},
            headers={"Authorization": f"Bearer {upload_user['token']}"},
        )
        assert res_webp.status_code == status.HTTP_201_CREATED


def test_rejects_spoofed_mime_type_with_invalid_bytes(client, upload_user):
    """Verify spoofed MIME type (text bytes declared as image/jpeg) is rejected by Pillow validation."""
    fake_bytes = b"This is plain text pretending to be an image file."
    response = client.post(
        "/api/uploads/complaint-photo",
        files={"file": ("fake.jpg", fake_bytes, "image/jpeg")},
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert response.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    assert "corrupted or invalid image" in response.json()["detail"].lower()


def test_rejects_mismatched_declared_mime_type(client, upload_user):
    """Verify mismatch between declared MIME and actual format is rejected."""
    png_bytes = generate_test_image_bytes("PNG")
    response = client.post(
        "/api/uploads/complaint-photo",
        files={"file": ("image.png", png_bytes, "image/jpeg")},  # Declared JPEG, but actually PNG
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert response.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    assert "does not match" in response.json()["detail"].lower()


def test_rejects_unsupported_declared_mime(client, upload_user):
    """Verify disallowed MIME types (e.g. application/pdf) are rejected."""
    response = client.post(
        "/api/uploads/complaint-photo",
        files={"file": ("doc.pdf", b"%PDF-1.4 ...", "application/pdf")},
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert response.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE


def test_rejects_oversized_file(client, upload_user):
    """Verify files larger than 5 MB are rejected immediately."""
    large_payload = b"A" * (5 * 1024 * 1024 + 10)
    response = client.post(
        "/api/uploads/complaint-photo",
        files={"file": ("huge.jpg", large_payload, "image/jpeg")},
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert response.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    assert "exceeds maximum allowed limit of 5 MB" in response.json()["detail"]


def test_rejects_empty_file(client, upload_user):
    """Verify 0-byte file is rejected."""
    response = client.post(
        "/api/uploads/complaint-photo",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "empty" in response.json()["detail"].lower()


def test_unconfigured_cloudinary_credentials(client, upload_user, monkeypatch):
    """Verify 503 error when Cloudinary settings are missing."""
    monkeypatch.setattr(settings, "CLOUDINARY_CLOUD_NAME", None)
    jpeg_bytes = generate_test_image_bytes("JPEG")

    response = client.post(
        "/api/uploads/complaint-photo",
        files={"file": ("test.jpg", jpeg_bytes, "image/jpeg")},
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert "not configured" in response.json()["detail"].lower()


def test_cloudinary_upstream_error(client, upload_user):
    """Verify 502 Bad Gateway when Cloudinary SDK throws an unexpected exception."""
    jpeg_bytes = generate_test_image_bytes("JPEG")
    with patch("cloudinary.uploader.upload", side_effect=Exception("Connection reset by peer")):
        response = client.post(
            "/api/uploads/complaint-photo",
            files={"file": ("test.jpg", jpeg_bytes, "image/jpeg")},
            headers={"Authorization": f"Bearer {upload_user['token']}"},
        )
        assert response.status_code == status.HTTP_502_BAD_GATEWAY


def test_complaint_creation_accepts_valid_cloudinary_url(client, upload_user):
    """Verify complaint creation succeeds with a valid HTTPS Cloudinary delivery URL."""
    payload = {
        "title": "Wall Crack Inspection",
        "category": "CARPENTRY",
        "description": "Crack visible near balcony wall",
        "photo_url": "https://res.cloudinary.com/testcloud/image/upload/v12345/society_complaints/sample.jpg",
    }
    response = client.post(
        "/api/complaints",
        json=payload,
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["photo_url"] == payload["photo_url"]


def test_complaint_creation_rejects_lookalike_or_non_cloudinary_urls(client, upload_user):
    """Verify complaint creation rejects malicious lookalikes, HTTP, or arbitrary external domains."""
    # Lookalike attack domain
    res_lookalike = client.post(
        "/api/complaints",
        json={
            "title": "Crack",
            "category": "OTHER",
            "description": "Wall crack description",
            "photo_url": "https://res.cloudinary.com.attacker.com/malicious.jpg",
        },
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert res_lookalike.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Insecure HTTP
    res_http = client.post(
        "/api/complaints",
        json={
            "title": "Crack",
            "category": "OTHER",
            "description": "Wall crack description",
            "photo_url": "http://res.cloudinary.com/testcloud/image/upload/sample.jpg",
        },
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert res_http.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # External domain
    res_external = client.post(
        "/api/complaints",
        json={
            "title": "Crack",
            "category": "OTHER",
            "description": "Wall crack description",
            "photo_url": "https://evil-storage.com/photo.jpg",
        },
        headers={"Authorization": f"Bearer {upload_user['token']}"},
    )
    assert res_external.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
