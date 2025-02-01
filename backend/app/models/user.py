from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.base import Base
import uuid

class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True, index=True, default=str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    organization_id = Column(String, ForeignKey("organization.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())