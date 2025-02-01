import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.organization import Organization, OrganizationCreate
from app.worker.tasks import process_long_task

router = APIRouter()

@router.get("/organizations/test")
def test_endpoint():
    return {"message": "Organization endpoint working"}

@router.post("/organizations/process")
async def start_processing():
    task_id = str(uuid.uuid4())
    # Submit task to Celery
    task = process_long_task.delay(task_id)
    return {
        "message": "Task started",
        "task_id": task_id,
        "celery_task_id": task.id
    }

@router.get("/organizations/task/{task_id}")
async def get_task_status(task_id: str):
    # Get task result from Celery [this is celery task id which we need to send here]
    task = process_long_task.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task.status,
        "result": task.result if task.ready() else None
    }