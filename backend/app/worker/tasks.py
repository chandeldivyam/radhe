import time
from app.core.celery_app import celery_app
from app.schemas.agent_task import AgentTaskStatus
import logging
import json
import requests
from app.core.config import settings

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
def process_agent_task(task_id: str):
    """
    Process an agent task, updating its status after a 10-second delay.
    
    Args:
        task_id: ID of the AgentTask to process
    """
    api_base_url = settings.BACKEND_BASE_URL
    
    try:
        # Update status to PROCESSING
        update_task_status(task_id, AgentTaskStatus.PROCESSING, api_base_url)
        logger.info(f"Task {task_id} is now processing")

        # Simulate processing with a 10-second delay
        time.sleep(10)

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

def update_task_status(task_id: str, status: AgentTaskStatus, api_base_url: str):
    """
    Helper function to update task status via API
    """
    url = f"{api_base_url}/api/v1/agent_tasks/{task_id}/status"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": settings.WORKER_API_KEY
    }
    data = {"status": status}
    
    response = requests.put(url, headers=headers, data=json.dumps(data))
    
    if response.status_code != 200:
        logger.error(f"Failed to update task status. Status code: {response.status_code}, Response: {response.text}")
        raise Exception(f"Failed to update task status: {response.text}")
    
    return response.json()
