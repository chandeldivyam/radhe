from typing import List, Optional
from app.services.task_agents.base_agent import BaseAgent

# Lets create temporary markdown to return for now without processing
TEMP_OUTPUT = [
   {
       "title": "Project Planning and Documentation Guidelines",
       "content": "## Effective Project Documentation Strategies\n\nCreating comprehensive project documentation is crucial for successful team collaboration and project management. Key considerations include:\n\n* **Clarity and Conciseness**: Ensure documentation is clear, straightforward, and easy to understand by all team members.\n\n* **Version Control**: Maintain a systematic approach to tracking document versions and updates.\n\n* **Structured Format**: Use consistent markdown formatting to improve readability and navigation.\n\n### Essential Documentation Components\n\n1. **Project Overview**: Provide a high-level summary of project goals, scope, and key stakeholders.\n2. **Technical Specifications**: Detail technical requirements, architecture, and implementation strategies.\n3. **Communication Protocols**: Outline team communication channels and reporting mechanisms.\n\n*Note: Regularly review and update documentation to reflect current project status and insights.*"
   },
   {
       "title": "Software Development Best Practices",
       "content": "## Principles of Modern Software Development\n\nSuccessful software development requires a holistic approach that balances technical excellence with team dynamics. Key principles include:\n\n* **Agile Methodology**: Implement iterative development cycles that promote flexibility and continuous improvement.\n\n* **Code Quality**: Maintain high standards of code readability, maintainability, and performance.\n\n### Core Development Strategies\n\n1. **Test-Driven Development (TDD)**: Write comprehensive unit tests before implementing code functionality.\n2. **Continuous Integration/Continuous Deployment (CI/CD)**: Automate testing and deployment processes.\n3. **Code Reviews**: Establish a robust peer review system to ensure code quality and knowledge sharing.\n\n*Tip: Prioritize clean, modular code that can be easily understood and modified by team members.*"
   },
   {
       "title": "Effective Team Collaboration Techniques",
       "content": "## Maximizing Team Performance and Communication\n\nBuilding a high-performing team requires strategic approaches to collaboration and interpersonal dynamics:\n\n* **Clear Communication**: Establish transparent and open communication channels across all team levels.\n\n* **Goal Alignment**: Ensure all team members understand project objectives and individual responsibilities.\n\n### Collaboration Tools and Practices\n\n1. **Regular Stand-up Meetings**: Conduct brief, focused daily or weekly check-ins.\n2. **Shared Documentation**: Utilize collaborative platforms for real-time document sharing and editing.\n3. **Conflict Resolution**: Develop proactive strategies for addressing and resolving team conflicts.\n\n*Remember: Effective collaboration is the cornerstone of team success and project achievement.*"
   }
]

class SaaSWikiAgent(BaseAgent):
    def __init__(self, task_id: str, video_urls: List[str], reference_notes_ids: Optional[List[str]], destination_note_id: Optional[str], instructions: str, organization_id: str):
        super().__init__(task_id, organization_id)
        self.video_urls = video_urls
        self.reference_notes_ids = reference_notes_ids
        self.destination_note_id = destination_note_id
        self.instructions = instructions

    def process_task(self):
        # Implementation of SaaS Wiki Agent
        return TEMP_OUTPUT