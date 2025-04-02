from fastapi import Depends, HTTPException, status, Security
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User
from app.schemas.auth import TokenPayload
from app.api.utils.security import oauth2_scheme, api_key_header
from app.api.utils.constants import ALGORITHM
from app.core.config import settings


async def verify_worker_api_key(
    api_key: str = Security(api_key_header),
) -> bool:
    """
    Verify the API key for worker authentication.
    
    This dependency is used for endpoints that need to be accessed by worker processes.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
        )
    
    if api_key != settings.WORKER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    
    return True

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
        
    return user 

async def get_user_from_refresh_token(
    db: Session = Depends(get_db),
    refresh_token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
        
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
        
    return user
