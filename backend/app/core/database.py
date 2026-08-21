from typing import Generator, Optional
from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from backend.app.core.config import settings


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy 2.x models."""
    pass


# Dynamic engine and SessionLocal holders
_engine = None
_SessionLocal = None


def get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        db_uri = settings.sqlalchemy_database_uri
        if db_uri:
            _engine = create_engine(
                db_uri,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=False,
            )
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _engine


def get_session_factory() -> Optional[sessionmaker]:
    get_engine()
    return _SessionLocal


# Module-level aliases for backwards compatibility with migrations and scripts
engine = get_engine()
SessionLocal = get_session_factory()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session.

    Fails with HTTP 503 if DATABASE_URL is not configured during live execution.
    Can be overridden cleanly in test suites via app.dependency_overrides[get_db].
    """
    factory = get_session_factory()
    if factory is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Please set the DATABASE_URL environment variable in your root .env file.",
        )
    db = factory()
    try:
        yield db
    finally:
        db.close()
