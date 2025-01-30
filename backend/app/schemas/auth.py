from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """Schema for JWT token payload"""
    sub: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    """Schema for login request"""
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str 

class RefreshResponse(BaseModel):
    """Schema for refresh token response"""
    access_token: str
