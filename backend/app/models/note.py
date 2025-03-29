from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.base import Base
import uuid

class Note(Base):
    __tablename__ = "note"

    id = Column(String, primary_key=True, index=True, default=str(uuid.uuid4()))
    title = Column(String, index=True)
    content = Column(Text, nullable=True)
    suggestion_content = Column(Text, nullable=True) # Markdown suggestion for creating new note with ai
    
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
    
    # Add this field for collaborative editing
    binary_content = Column(Text, nullable=True)  # Store the Yjs binary state as base64
    
    # Fix the self-referential relationship
    children = relationship(
        "Note",
        backref=backref('parent', remote_side=[id]),
        lazy='noload',  # Don't load by default
        cascade="all, delete-orphan"
    )

    referenced_by_tasks = relationship(
        "AgentTask",
        secondary="agent_task_reference_notes",
        back_populates="reference_notes",
        lazy="noload"  # Use dynamic loading if you don't always need tasks when loading a note
    )

    modified_by_tasks = relationship(
        "AgentTask",
        secondary="agent_task_modified_notes",
        back_populates="modified_notes",
        lazy="noload"  # Use dynamic loading
    )
    
    # Future fields to consider:
    # version = Column(Integer, default=1)
    # is_archived = Column(Boolean, default=False)
    # last_modified_by = Column(String, ForeignKey("user.id"))
    # sharing_settings = Column(JSON)