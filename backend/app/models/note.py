from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.base import Base
import uuid

class Note(Base):
    __tablename__ = "note"

    id = Column(String, primary_key=True, index=True, default=str(uuid.uuid4()))
    title = Column(String, index=True)
    content = Column(Text) # We'll migrate to JSON/JSONB later for rich text
    
    # Hierarchical structure
    parent_id = Column(String, ForeignKey("note.id"), nullable=True)
    path = Column(String, index=True)  # Materialized path for efficient traversal
    depth = Column(Integer, default=0)  # Nesting level
    children_count = Column(Integer, default=0)  # Add this column
    position = Column(Integer, nullable=False, default=0)  # For ordering siblings
    
    # Metadata
    organization_id = Column(String, ForeignKey("organization.id"), index=True)
    created_by = Column(String, ForeignKey("user.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Fix the self-referential relationship
    children = relationship(
        "Note",
        backref=backref('parent', remote_side=[id]),
        lazy='noload',  # Don't load by default
        cascade="all, delete-orphan"
    )
    
    # Future fields to consider:
    # version = Column(Integer, default=1)
    # is_archived = Column(Boolean, default=False)
    # last_modified_by = Column(String, ForeignKey("user.id"))
    # sharing_settings = Column(JSON)