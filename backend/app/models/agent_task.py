from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Enum, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid
import enum

class AgentTaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Association table for AgentTask -> Reference Notes (Many-to-Many)
agent_task_reference_notes = Table(
    "agent_task_reference_notes",
    Base.metadata,
    Column("agent_task_id", String, ForeignKey("agent_task.id"), primary_key=True),
    Column("note_id", String, ForeignKey("note.id"), primary_key=True),
)

# Association table for AgentTask -> Modified Notes (Many-to-Many)
agent_task_modified_notes = Table(
    "agent_task_modified_notes",
    Base.metadata,
    Column("agent_task_id", String, ForeignKey("agent_task.id"), primary_key=True),
    Column("note_id", String, ForeignKey("note.id"), primary_key=True),
)

class AgentTask(Base):
    __tablename__ = "agent_task"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))  # Use lambda for default
    agent_type = Column(String, nullable=False)
    status = Column(Enum(AgentTaskStatus), nullable=False, default=AgentTaskStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Input related fields
    video_urls = Column(JSON, nullable=False)  # Keep as JSON, list of strings
    destination_note_id = Column(String, ForeignKey("note.id"), nullable=True)  # Optional destination parent
    instructions = Column(String, nullable=True)

    # --- Relationships for Notes ---
    # Reference Notes (Input Context)
    reference_notes = relationship(
        "Note",
        secondary=agent_task_reference_notes,
        back_populates="referenced_by_tasks",
        lazy="selectin"  # Eager load reference notes when loading AgentTask
    )

    # Modified Notes (Output/Affected)
    modified_notes = relationship(
        "Note",
        secondary=agent_task_modified_notes,
        back_populates="modified_by_tasks",
        lazy="selectin"  # Eager load modified notes when loading AgentTask
    )
    # --- End Relationships ---

    # Foreign Keys for Ownership/Creation
    organization_id = Column(String, ForeignKey("organization.id"), index=True, nullable=False)
    created_by = Column(String, ForeignKey("user.id"), nullable=False)

    # Relationships for Ownership/Creation
    created_by_user = relationship("User", foreign_keys=[created_by])
    organization = relationship("Organization")  # Add relationship to Organization
    destination_note = relationship("Note", foreign_keys=[destination_note_id])  # Relationship to the destination note







    
    