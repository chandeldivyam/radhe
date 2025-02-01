# backend/app/db/init_db.py
import logging
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
from app.db.base import Base, engine, check_db_connection

# Configure logging
logger = logging.getLogger(__name__)

def init_db(drop_all: Optional[bool] = False) -> bool:
    """
    Initialize database tables
    
    Args:
        drop_all: If True, drops all existing tables before creation
        
    Returns:
        bool: True if initialization was successful, False otherwise
    """
    try:
        if not check_db_connection():
            logger.error("Failed to connect to database")
            return False
            
        if drop_all:
            logger.info("Dropping all tables...")
            Base.metadata.drop_all(bind=engine)
            
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialization completed successfully")
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False

if __name__ == "__main__":
    init_db()