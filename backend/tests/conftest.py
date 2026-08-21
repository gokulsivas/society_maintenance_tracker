import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure root and backend are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(backend_dir / "app")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.database import Base, get_db
from backend.app.models.setting import Setting
from backend.app.main import app

# Shared in-memory test engine with StaticPool
shared_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SharedTestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=shared_test_engine
)


@pytest.fixture(autouse=True)
def db_lifecycle():
    """Create fresh schema and seed default settings for each test."""
    Base.metadata.create_all(bind=shared_test_engine)
    db = SharedTestingSessionLocal()
    db.add(
        Setting(
            key="overdue_threshold_days",
            value="3",
            description="Default threshold for overdue complaints",
        )
    )
    db.commit()
    db.close()

    def override_get_db():
        session = SharedTestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=shared_test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    session = SharedTestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
