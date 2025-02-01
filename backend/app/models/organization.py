from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base
import uuid

class Organization(Base):
    __tablename__ = "organization"

    id = Column(String, primary_key=True, index=True, default=str(uuid.uuid4()))
    name = Column(String, index=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    is_active = Column(Boolean, default=True)
