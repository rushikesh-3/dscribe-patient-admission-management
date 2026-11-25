"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator
from urllib.parse import urlsplit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import initialize_database
from app.routers.patients import router as patients_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Initialize persistent tables once when the server starts."""
    initialize_database()
    yield


app = FastAPI(
    title="DScribe Patient Admission API",
    description="Backend foundation for the patient admission management app.",
    version="0.1.0",
    lifespan=lifespan,
)

LOCAL_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]


def get_allowed_origins() -> list[str]:
    """Combine local Vite origins with explicitly configured frontend origins."""
    configured_origins = [
        origin.strip().rstrip("/")
        for origin in os.environ.get("FRONTEND_URL", "").split(",")
        if origin.strip()
    ]
    for origin in configured_origins:
        parsed = urlsplit(origin)
        if (
            origin == "*"
            or parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.path
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError("FRONTEND_URL must contain comma-separated frontend origins, without paths or wildcards")

    return list(dict.fromkeys([*LOCAL_FRONTEND_ORIGINS, *configured_origins]))


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(patients_router)


@app.get("/api/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Return a simple response indicating that the API is running."""
    return {"status": "ok"}
