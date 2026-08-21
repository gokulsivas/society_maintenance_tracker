import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Explicit CORS Middleware configuration (never wildcard '*' with allow_credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(complaints_router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(admin_complaints_router, prefix="/api/admin/complaints", tags=["Admin Complaints"])
app.include_router(notices_router, prefix="/api/notices", tags=["Notices"])
app.include_router(admin_notices_router, prefix="/api/admin/notices", tags=["Admin Notices"])
app.include_router(uploads_router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(admin_dashboard_router, prefix="/api/admin", tags=["Admin Dashboard & Settings"])


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


@app.get("/")
def root() -> dict:
    return {
        "message": "Society Maintenance Tracker API is running",
        "docs": "/api/docs",
    }
