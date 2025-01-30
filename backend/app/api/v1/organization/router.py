from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.base import get_db
from app.schemas.organization import OrganizationCreate, Organization as OrganizationSchema
from app.schemas.user import User
from .service import OrganizationService
import logging
from app.api.utils.deps import get_current_user

router = APIRouter(prefix='/organizations')
logger = logging.getLogger(__name__)

@router.post("/create", response_model=OrganizationSchema, status_code=201)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new organization with an admin user.
    """
    try:
        org, user = await OrganizationService.create_organization(db, org_data)
        db.commit()
        return org
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