from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URL configuration
SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

# Engine configuration with connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,  # Number of permanent connections
    max_overflow=10,  # Number of additional connections when pool is full
    pool_timeout=30,  # Timeout for getting connection from pool
    pool_recycle=1800,  # Recycle connections after 30 minutes
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model
Base = declarative_base()

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database error occurred: {str(e)}")
        raise
    finally:
        db.close()

def check_db_connection():
    """Check if database connection is working"""
    try:
        with get_db() as db:
            db.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False

# Import all models at the end to avoid circular imports
from app.models.base import *  # noqa