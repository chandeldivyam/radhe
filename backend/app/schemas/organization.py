from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    admin_email: EmailStr
    admin_password: str

class Organization(OrganizationBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

class OrganizationWithAuth(Organization):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"