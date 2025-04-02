from abc import ABC, abstractmethod

class BaseAgent(ABC):
    def __init__(self, task_id: str, organization_id: str):
        self.task_id = task_id
        self.organization_id = organization_id
    
    @abstractmethod
    def process_task(self):
        pass