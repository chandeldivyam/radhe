from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.base import get_db
from app.schemas.user import UserAddByAdmin, User as UserSchema
from app.api.utils.deps import get_current_user
from .service import UserService
from app.models.user import User
import logging
from typing import List

# Create the router instance
router = APIRouter(prefix="/users")
logger = logging.getLogger(__name__)

@router.post("/add", response_model=UserSchema, status_code=201)
async def add_user(
    user_data: UserAddByAdmin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new user to the organization.
    Only authenticated users can add new users to their organization.
    """
    try:
        new_user = await UserService.add_user_by_admin(
            db=db,
            organization_id=current_user.organization_id,
            user_data=user_data
        )
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while adding the user"
        )

@router.get("/all", response_model=List[UserSchema])
async def get_organization_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all users in the current user's organization
    """
    try:
        users = await UserService.get_organization_users(
            db=db,
            organization_id=current_user.organization_id
        )
        return users
    except Exception as e:
        logger.error(f"Error fetching organization users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching users"
        )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete (soft delete) a user from the organization
    """
    try:
        success = await UserService.delete_user(
            db=db,
            user_id=user_id,
            organization_id=current_user.organization_id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the user"
        )
