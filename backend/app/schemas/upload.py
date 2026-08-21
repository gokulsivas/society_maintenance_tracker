from pydantic import BaseModel, Field


class PhotoUploadResponse(BaseModel):
    secure_url: str = Field(..., description="HTTPS URL of uploaded image on Cloudinary CDN")
    public_id: str = Field(..., description="Cloudinary public ID for the asset")
