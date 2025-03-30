# ./backend/app/services/task_agents/saas_wiki_agent.py
import logging
from typing import List, Optional, Dict
from typing_extensions import Annotated, TypedDict

# Langchain Imports
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel

# Local Imports
from app.services.task_agents.base_agent import BaseAgent
from app.services.llm import initialize_llm # Import the factory function

logger = logging.getLogger(__name__)

class SaaSWikiAgent(BaseAgent):
    _SYSTEM_PROMPT = """You are an expert technical writer tasked with generating a concise wiki article suitable for a SaaS company's internal knowledge base.
Focus on topics relevant to software development, project management, team collaboration, or SaaS business practices.
Generate **one** article in markdown format. Ensure the title is descriptive and the content is well-structured using markdown (headers, lists, etc.).
Ensure the output strictly adheres to the required JSON schema with 'title' and 'content' keys."""

    class MarkdownArticle(TypedDict):
        """Defines the structure for a single markdown wiki article."""
        title: Annotated[str, ..., "A concise and descriptive title for the article, typically 5-10 words."]
        content: Annotated[str, ..., "The main body of the article in well-formatted Markdown. Should include headers, lists, or other relevant markdown elements for clarity."]

    def __init__(self, task_id: str,
                 video_urls: List[str],
                 reference_notes_ids: Optional[List[str]],
                 destination_note_id: Optional[str],
                 instructions: str,
                 organization_id: str,
                 llm_provider: str,
                 llm_model: str):
        super().__init__(task_id, organization_id)
        self.video_urls = video_urls
        self.reference_notes_ids = reference_notes_ids
        self.destination_note_id = destination_note_id
        self.instructions = instructions

        self.llm_provider = llm_provider
        self.llm_model = llm_model

        try:
            self.llm: BaseChatModel = initialize_llm(
                llm_provider=self.llm_provider,
                llm_model=self.llm_model
            )
        except (ValueError, RuntimeError) as e:
            logger.error(f"Failed to initialize LLM for agent task {task_id}: {e}")
            raise RuntimeError(f"Could not initialize LLM for agent: {e}") from e

        self.reference_notes = [] # Keep this if needed

    def _get_reference_notes(self):
        # TODO: Implement ability to get all reference notes, if there are children, we should also get those as well
        self.reference_notes = []
        return self.reference_notes

    def process_task(self):
        self._get_reference_notes()

        markdown_articles: List[Dict[str, str]] = []
        num_articles_to_generate = len(self.video_urls)

        if num_articles_to_generate == 0:
            logger.warning(f"Task {self.task_id}: No video URLs provided, terminating agent")
            return []

        prompt_messages = [
            SystemMessage(content=self._SYSTEM_PROMPT),
            HumanMessage(content=f"Generate a wiki article based on the system instructions. You can use the following context if relevant, otherwise generate a general article on the specified topics: {self.instructions or 'General SaaS/Software topic'}")
        ]

        try:
            structured_llm = self.llm.with_structured_output(self.MarkdownArticle)
        except AttributeError:
            logger.error(f"Task {self.task_id}: The initialized LLM client ({self.llm.__class__.__name__}) might not support `with_structured_output`. Provider: {self.llm_provider}, Model: {self.llm_model}")
            return []
        except Exception as e:
            logger.error(f"Task {self.task_id}: Error setting up structured output for {self.llm_provider}/{self.llm_model}: {e}", exc_info=True)
            return []

        # Generate one article per video URL (current logic, might need refinement)
        for video_url in self.video_urls:
            # TODO: If video content/transcript is available, it should be added to the prompt context here.
            # Currently, the video_url itself isn't used in the prompt.
            logger.info(f"Task {self.task_id}: Generating article for video (placeholder logic): {video_url}")

            try:
                # Invoke the LLM with the prompt
                generated_article: Dict[str, str] = structured_llm.invoke(prompt_messages)

                # Validate the output structure
                if not generated_article or not isinstance(generated_article, dict) or \
                   not generated_article.get("title") or not generated_article.get("content"):
                    logger.warning(f"Task {self.task_id}: Generated article has missing title/content or invalid format. LLM Output: {generated_article}")
                    continue # Skip this article

                # Add the valid article to the list
                markdown_articles.append(generated_article)
                logger.info(f"Task {self.task_id}: Successfully generated article: {generated_article.get('title', 'Untitled')}")

            except Exception as e:
                logger.error(f"Task {self.task_id}: Error generating article using {self.llm_provider}/{self.llm_model}: {e}", exc_info=True)
                continue # Skip this article on error

        logger.info(f"Task {self.task_id}: Finished processing. Generated {len(markdown_articles)} articles.")
        return markdown_articles