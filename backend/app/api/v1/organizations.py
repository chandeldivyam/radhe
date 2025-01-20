from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.organization import Organization, OrganizationCreate

router = APIRouter()

@router.get("/organizations/test")
def test_endpoint():
    return {"message": "Organization endpoint working"}