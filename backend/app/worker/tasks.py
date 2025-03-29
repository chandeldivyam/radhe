import time
from app.core.celery_app import celery_app
from app.schemas.agent_task import AgentTaskStatus
import logging
from app.core.config import settings
from app.worker.utils import update_task_status, get_task_details, create_suggestion_note
from app.services.task_agents import SaaSWikiAgent

logger = logging.getLogger(__name__)

@celery_app.task(name="process_long_task")
def process_long_task(task_id: str):
    """
    Example long-running task that simulates processing
    """
    logger.info(f"Starting long task {task_id}")
    # Simulate long processing
    time.sleep(10)
    logger.info(f"Completed long task {task_id}")
    return {"task_id": task_id, "status": "completed"}

@celery_app.task(name="process_agent_task")
def process_agent_task(task_id: str, organization_id: str, user_id: str):
    """
    Process an agent task, updating its status after processing.
    
    Args:
        task_id: ID of the AgentTask to process
        organization_id: ID of the organization
        user_id: ID of the user who created the task
    """
    api_base_url = settings.BACKEND_BASE_URL
    
    try:
        # Update status to PROCESSING
        update_task_status(task_id, AgentTaskStatus.PROCESSING, api_base_url)
        logger.info(f"Task {task_id} is now processing")

        # Fetch task details from the API
        task_details = get_task_details(task_id, organization_id, api_base_url)
        logger.info(f"Retrieved task details for task {task_id}")
        
        # Extract required parameters for the agent
        video_urls = task_details.get("video_urls", [])
        reference_notes_ids = task_details.get("reference_notes_ids", [])
        destination_note_id = task_details.get("destination_note_id")
        instructions = task_details.get("instructions", "")
        
        # Initialize the SaaSWikiAgent with task parameters
        wiki_agent = SaaSWikiAgent(
            task_id=task_id,
            video_urls=video_urls,
            reference_notes_ids=reference_notes_ids,
            destination_note_id=destination_note_id,
            instructions=instructions,
            organization_id=organization_id
        )
        
        # Process the task and get the output
        agent_output = wiki_agent.process_task()
        logger.info(f"SaaSWikiAgent processed task {task_id}")
        
        # Create suggestion notes with the output
        for note_data in agent_output:
            create_suggestion_note(
                title=note_data["title"],
                content=note_data["content"],
                suggestion_content=note_data["content"],
                parent_id=destination_note_id,
                user_id=user_id,
                organization_id=organization_id,
                api_base_url=api_base_url
            )
        
        # Update status to COMPLETED
        update_task_status(task_id, AgentTaskStatus.COMPLETED, api_base_url)
        logger.info(f"Task {task_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing task {task_id}: {e}")
        try:
            # Update status to FAILED
            update_task_status(task_id, AgentTaskStatus.FAILED, api_base_url)
        except Exception as update_error:
            logger.error(f"Failed to update task status to FAILED: {update_error}")
