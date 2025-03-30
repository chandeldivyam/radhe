from sqlalchemy.orm import Session
from typing import Optional
from app.models.agent_task import AgentTask
from app.models.note import Note
from app.schemas.agent_task import AgentTaskCreate, AgentTaskResponse, AgentTaskStatus, AgentTaskList, AgentTaskListResponse
from app.core.celery_app import celery_app
import logging
from sqlalchemy import func
from sqlalchemy.orm import load_only, selectinload

logger = logging.getLogger(__name__)


class AgentTaskService:
    
    @staticmethod
    async def create_agent_task(
        db: Session,
        agent_task_data: AgentTaskCreate,
        user_id: str,
        organization_id: str
    ) -> AgentTaskResponse:
        task = AgentTask(
            agent_type=agent_task_data.agent_type,
            title=agent_task_data.title,
            status=AgentTaskStatus.PENDING,
            video_urls=agent_task_data.video_urls,
            destination_note_id=agent_task_data.destination_note_id,
            instructions=agent_task_data.instructions,
            organization_id=organization_id,
            created_by=user_id
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        if agent_task_data.reference_notes_ids:
            reference_notes = db.query(Note).filter(Note.id.in_(agent_task_data.reference_notes_ids)).all()
            task.reference_notes.extend(reference_notes)
            db.commit()

        # Trigger Celery task
        celery_app.send_task('process_agent_task', args=[task.id, organization_id, user_id])
        return AgentTaskResponse.model_validate(task)
        
    @staticmethod
    async def get_agent_task(
        task_id: str,
        db: Session,
        organization_id: str
    ) -> Optional[AgentTaskResponse]:
        task = db.query(AgentTask)\
        .options(
            selectinload(AgentTask.reference_notes),
            selectinload(AgentTask.modified_notes),
            selectinload(AgentTask.destination_note)
        )\
        .filter(AgentTask.id == task_id, AgentTask.organization_id == organization_id)\
        .first()
        if not task:
            return None
        return AgentTaskResponse.model_validate(task)
        
    @staticmethod
    async def update_task_status(
        task_id: str,
        status: AgentTaskStatus,
        db: Session
    ) -> Optional[AgentTaskResponse]:
        """
        Update the status of an agent task.
        This method is used by the worker API endpoint.
        """
        task = db.query(AgentTask)\
        .options(
            selectinload(AgentTask.reference_notes),
            selectinload(AgentTask.modified_notes),
            selectinload(AgentTask.destination_note)
        )\
        .filter(AgentTask.id == task_id).first()
        if not task:
            return None
        
        task.status = status
        db.commit()
        db.refresh(task)
        
        return AgentTaskResponse.model_validate(task)
    
    @staticmethod
    async def list_agent_tasks(
        db: Session,
        organization_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> AgentTaskList:
        # We need to fetch task with offset and limit from the database
        tasks = db.query(AgentTask).where(AgentTask.organization_id == organization_id).options(load_only(AgentTask.id, AgentTask.agent_type, AgentTask.title, AgentTask.status, AgentTask.created_at)).order_by(AgentTask.created_at.desc()).offset(skip).limit(limit).all()
        total = db.query(func.count(AgentTask.id)).where(AgentTask.organization_id == organization_id).scalar()
        return AgentTaskList(items=[AgentTaskListResponse.model_validate(task) for task in tasks], total=total)
        
