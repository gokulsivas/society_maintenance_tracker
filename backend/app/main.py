import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

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

# Also register routers directly without /api prefix
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


@app.get("/api")
@app.get("/api/index.py")
def api_root() -> dict:
    return health_check()


# Mount static assets directory
for asset_path in [
    root_dir / "frontend" / "dist" / "assets",
    root_dir / "dist" / "assets",
    Path("frontend/dist/assets"),
    Path("dist/assets"),
]:
    if asset_path.exists():
        app.mount("/assets", StaticFiles(directory=str(asset_path)), name="assets")
        break

DEFAULT_INDEX_HTML = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Society Maintenance Tracker</title>
    <script type="module" crossorigin src="/assets/index-CgJi1ki1.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-BpdY0n0V.css">
  </head>
  <body class="bg-gray-50 text-gray-900 antialiased min-h-screen">
    <div id="root"></div>
  </body>
</html>"""


def get_html_content() -> str:
    for p in [
        root_dir / "frontend" / "dist" / "index.html",
        root_dir / "dist" / "index.html",
        Path("frontend/dist/index.html"),
        Path("dist/index.html"),
    ]:
        if p.exists():
            return p.read_text(encoding="utf-8")
    return DEFAULT_INDEX_HTML


@app.get("/")
@app.get("/index.html")
def root_spa():
    return HTMLResponse(content=get_html_content(), status_code=200)


@app.get("/{full_path:path}")
def catch_all_spa(full_path: str):
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(status_code=404, detail="API endpoint not found")

    for d in [root_dir / "frontend" / "dist", root_dir / "dist", Path("frontend/dist"), Path("dist")]:
        target = d / full_path
        if target.exists() and target.is_file():
            return FileResponse(str(target))

    return HTMLResponse(content=get_html_content(), status_code=200)
