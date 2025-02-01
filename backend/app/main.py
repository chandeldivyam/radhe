from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import organizations, users, files
from app.core.logging import setup_logging
import logging
import time
import uuid

# Setup logging
logger, opensearch_handler = setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Middleware to add request ID and log request/response
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Log request details to OpenSearch
    await opensearch_handler.log_request(request, request_id)
    
    # Add request ID to log context
    logger.info(
        "Request started",
        extra={"request_id": request_id}
    )
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "process_time_ms": round(process_time * 1000, 2),
            "status_code": response.status_code
        }
    )
    
    return response

# Include routers
app.include_router(organizations.router, prefix="/api/v1", tags=["organizations"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(files.router, prefix="/api/v1/files", tags=["files"])

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the radhe-backend"}