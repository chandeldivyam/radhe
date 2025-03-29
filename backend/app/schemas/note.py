from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from pydantic import field_validator

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str]
    parent_id: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class NoteSuggest(NoteBase):
    user_id: str
    organization_id: str
    suggestion_content: Optional[str]

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str]

class NoteMoveRequest(BaseModel):
    new_parent_id: Optional[str] = None
    before_id: Optional[str] = None  # Note ID to position before
    after_id: Optional[str] = None   # Note ID to position after

class NoteResponse(NoteBase):
    id: str
    organization_id: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]
    path: str
    depth: int
    children_count: int
    position: int
    suggestion_content: Optional[str]

    class Config:
        from_attributes = True

class RootNotesResponse(BaseModel):
    items: List[NoteResponse]
    total: int

    class Config:
        from_attributes = True

# This is needed for the recursive type reference in children
NoteResponse.model_rebuild()

class NoteListResponse(BaseModel):
    id: str
    title: str
    organization_id: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]
    path: str
    depth: int
    children_count: int
    position: int
    parent_id: Optional[str]

    class Config:
        from_attributes = True

class NoteDetailResponse(NoteListResponse):
    content: Optional[str]
    suggestion_content: Optional[str]

class NoteWSResponse(BaseModel):
    binary_content: Optional[List[int]] = None

class NoteWSUpdate(BaseModel):
    update: List[int]
