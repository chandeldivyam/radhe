from sqlalchemy.orm import Session
from typing import List
from app.models.user import User
from app.schemas.user import UserAddByAdmin, User as UserSchema
from app.api.utils.security import get_password_hash
import uuid

class UserService:
    @staticmethod
    async def add_user_by_admin(
        db: Session,
        organization_id: str,
        user_data: UserAddByAdmin
    ) -> UserSchema:
        # Create new user
        db_user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            organization_id=organization_id,
            is_active=True
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return UserSchema.model_validate(db_user)

    @staticmethod
    async def get_organization_users(
        db: Session,
        organization_id: str
    ) -> List[UserSchema]:
        users = db.query(User).filter(
            User.organization_id == organization_id,
            User.is_active == True
        ).all()
        return [UserSchema.model_validate(user) for user in users]

    @staticmethod
    async def delete_user(
        db: Session,
        user_id: str,
        organization_id: str
    ) -> bool:
        user = db.query(User).filter(
            User.id == user_id,
            User.organization_id == organization_id
        ).first()
        
        if not user:
            return False
            
        # Soft delete the user
        user.is_active = False
        db.commit()
        return True
