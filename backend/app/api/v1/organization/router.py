from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.base import get_db
from app.schemas.organization import OrganizationCreate, Organization as OrganizationSchema, OrganizationWithAuth
from app.schemas.user import User
from .service import OrganizationService
import logging
from app.api.utils.deps import get_current_user
from app.api.v1.auth.service import AuthService

router = APIRouter(prefix='/organizations')
logger = logging.getLogger(__name__)

@router.post("/create", response_model=OrganizationWithAuth, status_code=201)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new organization with an admin user and return auth tokens.
    """
    try:
        org, user = await OrganizationService.create_organization(db, org_data)
        # Get auth tokens for the new user
        tokens = await AuthService.create_tokens(user.id)
        
        # Combine organization data with tokens
        response = OrganizationWithAuth(
            **org.model_dump(),
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token
        )
        
        db.commit()
        return response
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Organization with this name or user with this email already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating organization: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the organization"
        )

@router.get("/me", response_model=OrganizationSchema)
async def get_my_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the organization of the current user"""
    org = await OrganizationService.get_organization_by_user_id(db, current_user.organization_id)
    if not org:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )
    return org