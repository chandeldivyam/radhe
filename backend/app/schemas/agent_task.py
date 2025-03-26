from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AgentType(str, Enum):
    SAAS_WIKI_AGENT = "saas_wiki_agent"

class AgentTaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class AgentTaskBase(BaseModel):
    agent_type: AgentType
    status: AgentTaskStatus
    organization_id: str
    
    

class AgentTaskCreate(BaseModel):
    agent_type: AgentType
    video_urls: List[str]
    reference_notes_ids: Optional[List[str]]
    destination_note_id: Optional[str]
    instructions: Optional[str]

    @field_validator('video_urls')
    @classmethod
    def validate_video_urls(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one video URL must be provided')
        if any(url.strip() == '' for url in v):
            raise ValueError('Video URLs cannot be empty strings')
        return v

    @field_validator('reference_notes_ids', mode='before')
    @classmethod
    def ensure_list_or_none(cls, v):
        # Ensure empty list is treated as None if desired, or just allow empty list
        if v == []:
            return None
        return v
    
class AgentTaskResponse(AgentTaskBase):
    id: str
    created_at: datetime
    updated_at: datetime
    video_urls: List[str]
    destination_note_id: Optional[str]
    instructions: Optional[str]
    created_by: str  # Add who created it

    # These fields will be populated from the relationships in your endpoint/service
    reference_notes_ids: Optional[List[str]] = []
    modified_note_ids: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True)

class AgentTaskListResponse(AgentTaskBase):
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    model_config = ConfigDict(from_attributes=True)

class AgentTaskList(BaseModel):
    items: List[AgentTaskListResponse]
    total: int

# New schema for updating task status
class AgentTaskStatusUpdate(BaseModel):
    status: AgentTaskStatus