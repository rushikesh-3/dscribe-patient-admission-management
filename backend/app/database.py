"""SQLite connection and SQLAlchemy session configuration."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from collections.abc import Generator

from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parent / "database.db"
DATABASE_PATH = Path(os.environ.get("DATABASE_PATH", str(DEFAULT_DATABASE_PATH))).expanduser().resolve()
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base class used by SQLAlchemy database models."""


def get_db() -> Generator[Session, None, None]:
    """Provide one database session for an API request and then close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def initialize_database() -> None:
    """Create missing database tables without deleting existing data."""
    # Import here so model classes are registered in Base.metadata first.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
