from fastapi import APIRouter, Depends, HTTPException
from app.api.utils.deps import get_current_user, verify_worker_api_key
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.agent_task import AgentTaskCreate, AgentTaskResponse, AgentTaskStatusUpdate, AgentTaskList, AgentTaskListResponse
from app.api.v1.agent_task.service import AgentTaskService
from app.models.user import User
from fastapi import Query
import logging

router = APIRouter(prefix="/agent_tasks")
logger = logging.getLogger(__name__)

@router.post("/", response_model=AgentTaskResponse)
async def create_agent_task(
    agent_task_data: AgentTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        agent_task = await AgentTaskService.create_agent_task(
            db=db,
            agent_task_data=agent_task_data,
            user_id=current_user.id,
            organization_id=current_user.organization_id
        )
        return agent_task
    except Exception as e:
        logger.error(f"Error creating agent task: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/worker/{organization_id}/{task_id}")
async def get_agent_task(
    organization_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_worker_api_key)
):
    try:
        agent_task = await AgentTaskService.get_agent_task(
            task_id=task_id,
            db=db,
            organization_id=organization_id
        )
        if not agent_task:
            raise HTTPException(status_code=404, detail="Agent task not found")
        return agent_task
    except Exception as e:
        logger.error(f"Error getting agent task: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{task_id}", response_model=AgentTaskResponse)
async def get_agent_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        agent_task = await AgentTaskService.get_agent_task(
            task_id=task_id,
            db=db,
            organization_id=current_user.organization_id
        )
        if not agent_task:
            raise HTTPException(status_code=404, detail="Agent task not found")
        return agent_task
    except Exception as e:
        logger.error(f"Error getting agent task: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{task_id}/status", response_model=AgentTaskResponse)
async def update_task_status(
    task_id: str,
    status_update: AgentTaskStatusUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_worker_api_key)
):
    """
    Update the status of an agent task.
    This endpoint is used by the worker and requires API key authentication.
    """
    try:
        agent_task = await AgentTaskService.update_task_status(
            task_id=task_id,
            status=status_update.status,
            db=db
        )
        if not agent_task:
            raise HTTPException(status_code=404, detail="Agent task not found")
        return agent_task
    except Exception as e:
        logger.error(f"Error updating agent task status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/", response_model=AgentTaskList)
async def list_agent_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=50, description="Number of items to return")
):
    try:
        task_list = await AgentTaskService.list_agent_tasks(
            db=db,
            organization_id=current_user.organization_id,
            skip=skip,
            limit=limit
        )
        return task_list
    except Exception as e:
        logger.error(f"Error listing agent tasks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
