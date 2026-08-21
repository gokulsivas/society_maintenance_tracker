from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from backend.app.core.cloudinary import (
    validate_image_content,
    upload_complaint_image,
)
from backend.app.core.dependencies import require_resident
from backend.app.models.user import User
from backend.app.schemas.upload import PhotoUploadResponse

router = APIRouter()

MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@router.post(
    "/complaint-photo",
    response_model=PhotoUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload complaint photo to Cloudinary",
)
async def upload_complaint_photo(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP; max 5MB)"),
    current_user: User = Depends(require_resident),
) -> PhotoUploadResponse:
    """Upload a complaint photo to Cloudinary server-side without local disk persistence.

    Validates declared MIME type, enforces streaming 5 MB limit, and inspects image headers via Pillow.
    """
    # 1. Validate declared Content-Type header
    declared_type = file.content_type.lower() if file.content_type else ""
    if declared_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: '{declared_type}'. Allowed types are: image/jpeg, image/png, image/webp.",
        )

    # 2. Read at most MAX_UPLOAD_SIZE + 1 bytes to prevent unbounded memory usage
    file_bytes = await file.read(MAX_UPLOAD_SIZE + 1)

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(file_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed limit of 5 MB.",
        )

    # 3. Content inspection & magic byte verification via Pillow
    validate_image_content(file_bytes, declared_type)

    # 4. Upload to Cloudinary in-memory
    upload_result = upload_complaint_image(file_bytes)

    return PhotoUploadResponse(
        secure_url=upload_result["secure_url"],
        public_id=upload_result["public_id"],
    )
