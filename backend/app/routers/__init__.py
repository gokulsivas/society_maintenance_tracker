from backend.app.routers.auth import router as auth_router
from backend.app.routers.complaints import router as complaints_router
from backend.app.routers.admin_complaints import router as admin_complaints_router
from backend.app.routers.notices import router as notices_router
from backend.app.routers.admin_notices import router as admin_notices_router
from backend.app.routers.uploads import router as uploads_router
from backend.app.routers.admin_dashboard import router as admin_dashboard_router

__all__ = [
    "auth_router",
    "complaints_router",
    "admin_complaints_router",
    "notices_router",
    "admin_notices_router",
    "uploads_router",
    "admin_dashboard_router",
]
