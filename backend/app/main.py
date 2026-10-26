from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, init_db_schema
from app.api.v1.api import api_router
from app.services.storage import init_storage, UPLOAD_DIR
from app.services.scheduler import scheduler_worker
# Ensure all models are imported so Base.metadata knows about them
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure upload directories exist
    init_storage()
    # Create tables if they do not exist and ensure schema compatibility
    init_db_schema()
    # Start background scheduler for follow-up reminders
    scheduler_worker.start()
    yield
    # Stop background scheduler gracefully on shutdown
    await scheduler_worker.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-tenant Real Estate Lead Management CRM API for Pakistani agencies and developers.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS setup
origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]
if "*" not in origins:
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


app.include_router(api_router, prefix=settings.API_V1_STR)

# Object storage static mount for property images
init_storage()
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "PropStackly CRM Backend",
        "version": "2.0.0",
        "environment": "development",
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to PropStackly CRM API. Access /docs for interactive documentation.",
        "api_v1": "/api/v1",
    }
