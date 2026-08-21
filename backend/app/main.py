import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure root and backend are in sys.path
app_dir = Path(__file__).resolve().parent
backend_dir = app_dir.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(app_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings
from backend.app.routers.auth import router as auth_router
from backend.app.routers.complaints import router as complaints_router
from backend.app.routers.admin_complaints import router as admin_complaints_router
from backend.app.routers.notices import router as notices_router
from backend.app.routers.admin_notices import router as admin_notices_router
from backend.app.routers.uploads import router as uploads_router
from backend.app.routers.admin_dashboard import router as admin_dashboard_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Explicit CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers under /api prefix
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(complaints_router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(admin_complaints_router, prefix="/api/admin/complaints", tags=["Admin Complaints"])
app.include_router(notices_router, prefix="/api/notices", tags=["Notices"])
app.include_router(admin_notices_router, prefix="/api/admin/notices", tags=["Admin Notices"])
app.include_router(uploads_router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(admin_dashboard_router, prefix="/api/admin", tags=["Admin Dashboard & Settings"])

# Also register routers directly without /api prefix for Vercel subpath rewrites
app.include_router(auth_router, prefix="/auth", tags=["Auth (Direct)"])
app.include_router(complaints_router, prefix="/complaints", tags=["Complaints (Direct)"])
app.include_router(admin_complaints_router, prefix="/admin/complaints", tags=["Admin Complaints (Direct)"])
app.include_router(notices_router, prefix="/notices", tags=["Notices (Direct)"])
app.include_router(admin_notices_router, prefix="/admin/notices", tags=["Admin Notices (Direct)"])
app.include_router(uploads_router, prefix="/uploads", tags=["Uploads (Direct)"])
app.include_router(admin_dashboard_router, prefix="/admin", tags=["Admin Dashboard & Settings (Direct)"])


@app.get("/api/health")
def health_check() -> dict:
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database_configured": settings.is_database_configured,
    }


@app.get("/health")
def health_check_alt() -> dict:
    return health_check()


# Static file serving for Frontend fallback
dist_dir = root_dir / "frontend" / "dist"
assets_dir = dist_dir / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/")
@app.get("/index.html")
def serve_spa_root():
    index_file = dist_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html")
    return {
        "message": "Society Maintenance Tracker API is running",
        "docs": "/api/docs",
    }


@app.get("/{full_path:path}")
def serve_spa_fallback(full_path: str):
    # If path starts with api/ or is an api path, 404
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # Check if a static file directly matches in frontend/dist
    target_file = dist_dir / full_path
    if target_file.exists() and target_file.is_file():
        return FileResponse(str(target_file))

    # Otherwise return SPA index.html
    index_file = dist_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file), media_type="text/html")

    raise HTTPException(status_code=404, detail="Not Found")
