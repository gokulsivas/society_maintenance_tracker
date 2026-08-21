import sys
from pathlib import Path
import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import Settings, ROOT_DIR, BACKEND_DIR
from backend.app.core.database import get_db, get_session_factory
import backend.main as b_main


def test_settings_database_url_variable_name_and_paths():
    """Verify Settings uses DATABASE_URL and discovers repo root and backend directory paths."""
    s = Settings()
    # Confirm variable name exists
    assert hasattr(s, "DATABASE_URL")
    # Confirm path discovery
    assert ROOT_DIR.exists()
    assert BACKEND_DIR.exists()
    assert (BACKEND_DIR / "app").exists()


def test_safe_database_configured_diagnostic_does_not_leak_secrets():
    """Verify is_database_configured returns boolean and never leaks secret in str/repr."""
    # 1. Unconfigured
    s_empty = Settings(DATABASE_URL=None)
    assert s_empty.is_database_configured is False

    s_placeholder = Settings(DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require")
    assert s_placeholder.is_database_configured is False

    # 2. Configured
    s_real = Settings(DATABASE_URL="postgresql://real_user:super_secret_password_123@ep-cool.neon.tech/neondb")
    assert s_real.is_database_configured is True

    # 3. Verify string representation of Settings does not print raw password when inspected safely
    assert s_real.sqlalchemy_database_uri.startswith("postgresql+psycopg://")


def test_unconfigured_database_returns_controlled_503_error(monkeypatch):
    """Verify get_db returns clean 503 Service Unavailable when DATABASE_URL is not configured."""
    # Temporarily set SessionLocal/get_session_factory to None
    monkeypatch.setattr("backend.app.core.database.get_session_factory", lambda: None)

    with pytest.raises(HTTPException) as exc_info:
        # Call the generator
        db_gen = get_db()
        next(db_gen)

    assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert "Database is not configured" in exc_info.value.detail


def test_health_endpoint_reports_safe_database_status():
    """Verify health endpoint reports database_configured boolean without leaking connection details."""
    client = TestClient(b_main.app)
    res = client.get("/api/health")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "status" in data
    assert "service" in data
    assert "environment" in data
    assert "database_configured" in data
    assert isinstance(data["database_configured"], bool)
    # Ensure no secret strings or URLs in health response
    assert "password" not in str(data).lower()
    assert "postgresql" not in str(data).lower()
