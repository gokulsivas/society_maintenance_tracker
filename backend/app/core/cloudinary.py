import io
import uuid
from typing import Optional
from urllib.parse import urlparse
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status
from PIL import Image

from backend.app.core.config import settings

MIME_TO_FORMAT = {
    "image/jpeg": "JPEG",
    "image/jpg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}


def validate_image_content(file_bytes: bytes, declared_content_type: Optional[str] = None) -> str:
    """Inspect actual file contents and headers using Pillow to ensure valid JPEG, PNG, or WebP bytes.

    Re-raises any explicit HTTPException unchanged and converts unreadable bytes to 415.
    """
    if len(file_bytes) < 12:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File is too small to be a valid image.",
        )

    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img.verify()
            format_name = img.format.upper() if img.format else ""
            if format_name not in ("JPEG", "PNG", "WEBP"):
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Unsupported image format: {format_name}. Only JPEG, PNG, and WebP are allowed.",
                )
            
            # Check declared MIME vs detected format if declared
            if declared_content_type:
                expected_format = MIME_TO_FORMAT.get(declared_content_type.lower())
                if expected_format and expected_format != format_name:
                    raise HTTPException(
                        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                        detail=f"Declared Content-Type ({declared_content_type}) does not match detected format ({format_name}).",
                    )

            return format_name
    except HTTPException:
        # Re-raise explicit HTTP exceptions unchanged
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Corrupted or invalid image file. Content does not match a supported image format.",
        )


def is_valid_cloudinary_url(url: str, expected_cloud_name: Optional[str] = None) -> bool:
    """Strictly validate that the URL is an authentic Cloudinary HTTPS endpoint with non-empty delivery path."""
    try:
        parsed = urlparse(url)
        if parsed.scheme != "https":
            return False
        # Exact hostname match — prevents lookalikes like res.cloudinary.com.attacker.com
        if parsed.netloc.lower() != "res.cloudinary.com":
            return False

        path_segments = [p for p in parsed.path.split("/") if p]
        # Must have at least /<cloud_name>/image/upload/...
        if len(path_segments) < 2:
            return False

        if expected_cloud_name:
            if path_segments[0] != expected_cloud_name:
                return False

        return True
    except Exception:
        return False


def upload_complaint_image(file_bytes: bytes) -> dict:
    """Upload verified image bytes directly to Cloudinary in-memory without local disk storage."""
    if not settings.is_cloudinary_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Photo upload service is not configured.",
        )

    # Configure Cloudinary SDK server-side
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

    unique_public_id = f"complaint_{uuid.uuid4().hex}"

    try:
        response = cloudinary.uploader.upload(
            file_bytes,
            folder=settings.CLOUDINARY_FOLDER,
            public_id=unique_public_id,
            resource_type="image",
            overwrite=False,
        )
        return {
            "secure_url": response["secure_url"],
            "public_id": response["public_id"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Cloudinary upload service failed. Please try again later.",
        )
