from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from pydantic import field_validator

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str
    parent_id: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str]

class NoteMoveRequest(BaseModel):
    new_parent_id: Optional[str] = None

class NoteResponse(NoteBase):
    id: str
    organization_id: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]
    path: str
    depth: int
    has_children: bool = False
    children: List['NoteResponse'] = []

    @field_validator('has_children', mode='before')
    @classmethod
    def set_has_children(cls, v, values):
        return bool(values.get('children', []))

    class Config:
        from_attributes = True

class RootNotesResponse(BaseModel):
    items: List[NoteResponse]
    total: int

    class Config:
        from_attributes = True

# This is needed for the recursive type reference in children
NoteResponse.model_rebuild()
