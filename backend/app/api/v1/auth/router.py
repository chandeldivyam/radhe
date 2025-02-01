from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.auth import Token, RefreshResponse
from app.models.user import User
from app.schemas.user import User as UserSchema
from .service import AuthService
from app.api.utils.deps import get_user_from_refresh_token, get_current_user
import logging

router = APIRouter(prefix="/auth")
logger = logging.getLogger(__name__)

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await AuthService.authenticate_user(
        db, form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    return await AuthService.create_tokens(user.id)

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    current_user: User = Depends(get_user_from_refresh_token),
):
    """
    Refresh access token
    """
    access_token = await AuthService.refresh_access_token(current_user.id)
    return RefreshResponse(access_token=access_token)

@router.get("/me", response_model=UserSchema)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Get the current user"""
    return current_user