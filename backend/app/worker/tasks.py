import time
from app.core.celery_app import celery_app
import logging

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