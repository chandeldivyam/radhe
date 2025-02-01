from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.user import User, UserCreate

router = APIRouter()

@router.get("/users/test")
def test_endpoint():
    return {"message": "Users endpoint working"}