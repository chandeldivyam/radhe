from app.schemas.agent_task import AgentTaskStatus
import requests
import json
from app.core.config import settings
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

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

def get_task_details(task_id: str, organization_id: str, api_base_url: str) -> Dict[str, Any]:
    """
    Fetch task details from the API.
    
    Args:
        task_id: ID of the task to fetch
        organization_id: ID of the organization
        api_base_url: Base URL of the API
        
    Returns:
        Dictionary containing task details
    """
    url = f"{api_base_url}/api/v1/agent_tasks/worker/{organization_id}/{task_id}"
    headers = {
        "X-API-Key": settings.WORKER_API_KEY
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        logger.error(f"Failed to fetch task details. Status code: {response.status_code}, Response: {response.text}")
        raise Exception(f"Failed to fetch task details: {response.text}")
    
    return response.json()

def create_suggestion_note(title: str, content: str, suggestion_content: str, parent_id: str, user_id: str, organization_id: str, api_base_url: str) -> Dict[str, Any]:
    """
    Create a suggestion note via the API.
    
    Args:
        title: Title of the note
        content: Content of the note
        parent_id: ID of the parent note
        user_id: ID of the user
        organization_id: ID of the organization
        api_base_url: Base URL of the API
        
    Returns:
        Dictionary containing the created note
    """
    url = f"{api_base_url}/api/v1/notes/ai/create"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": settings.WORKER_API_KEY
    }
    data = {
        "title": title,
        "content": content,
        "suggestion_content": suggestion_content,
        "parent_id": parent_id,
        "user_id": user_id,
        "organization_id": organization_id
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code != 200:
        logger.error(f"Failed to create suggestion note. Status code: {response.status_code}, Response: {response.text}")
        raise Exception(f"Failed to create suggestion note: {response.text}")
    
    return response.json()
