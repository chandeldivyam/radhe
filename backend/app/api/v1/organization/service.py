from sqlalchemy.orm import Session
from typing import Tuple
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationCreate, Organization as OrganizationSchema
from app.schemas.user import User as UserSchema
from app.api.utils.security import get_password_hash
from typing import Optional
import uuid

class OrganizationService:
    @staticmethod
    async def create_organization(
        db: Session, 
        org_data: OrganizationCreate
    ) -> Tuple[Organization, User]:
        # Create organization
        db_organization = Organization(
            id=str(uuid.uuid4()),
            name=org_data.name,
            is_active=True
        )
        db.add(db_organization)
        db.flush()

        # Create admin user
        db_user = User(
            id=str(uuid.uuid4()),
            email=org_data.admin_email,
            hashed_password=get_password_hash(org_data.admin_password),
            organization_id=db_organization.id,
            is_active=True
        )
        db.add(db_user)
        
        return OrganizationSchema.model_validate(db_organization), UserSchema.model_validate(db_user)

    @staticmethod
    async def get_organization_by_user_id(db: Session, organization_id: str) -> Optional[Organization]:
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        return OrganizationSchema.model_validate(org) if org else None
