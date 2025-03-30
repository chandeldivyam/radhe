# ./backend/app/services/task_agents/saas_wiki_agent.py
import logging
import os
import re
import tempfile
from typing import List, Optional, Dict
from typing_extensions import Annotated, TypedDict

# Langchain Imports
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel

# Local Imports
from app.services.task_agents.base_agent import BaseAgent
from app.services.llm import initialize_llm
from app.services.video_processor import download_video, extract_frames, generate_transcript
from app.worker.utils import get_public_url
import base64

logger = logging.getLogger(__name__)

class SaaSWikiAgent(BaseAgent):
    _SYSTEM_PROMPT = """You are an expert technical writer tasked with generating a concise wiki article suitable for a SaaS company's internal knowledge base.
Focus on topics relevant to software development, project management, team collaboration, or SaaS business practices.
Generate **one** article in markdown format per video. Ensure the title is descriptive and the content is well-structured using markdown (headers, lists, etc.).
When referencing images from the video, use the markdown image syntax with the frame number visible in the image, e.g., "\n\n![alt_text](frame_X)", where X is the frame number.
Ensure the output adheres to the JSON schema with 'title' and 'content' keys. Please make sure that the images are a seperate and not inline with the content.

Below is the transcript of a video, and images from the video are provided with frame numbers overlaid (e.g., ![alt_text](frame_1), ![alt_text](frame_2)). Use the transcript and images to create a detailed help center article explaining the concepts shown in the video. Be verbose and include all relevant details."""

    class MarkdownArticle(TypedDict):
        """Defines the structure for a single markdown wiki article."""
        title: Annotated[str, ..., "A concise and descriptive title for the article, typically 5-10 words."]
        content: Annotated[str, ..., "The main body of the article in well-formatted Markdown."]

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
        articles = []

        if not self.video_urls:
            logger.warning(f"Task {self.task_id}: No video URLs provided, terminating agent")
            return []

        for video_url in self.video_urls:
            try:
                video_path = download_video(video_url)
                logger.info(f"Task {self.task_id}: Downloaded video {video_url} to {video_path}")

                with tempfile.TemporaryDirectory() as temp_dir:
                    image_paths = extract_frames(video_path, temp_dir)
                    logger.info(f"Task {self.task_id}: Extracted {len(image_paths)} frames from {video_url}")

                    transcript = generate_transcript(video_path)
                    logger.info(f"Task {self.task_id}: Generated transcript for {video_url}")

                    system_message = SystemMessage(content=self._SYSTEM_PROMPT)
                    human_content = [
                        {"type": "text", "text": f"Transcript: {transcript}"},
                    ]
                    for image_path in image_paths:
                        with open(image_path, "rb") as f:
                            image_data = base64.b64encode(f.read()).decode("utf-8")
                        human_content.append({
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                        })
                    human_message = HumanMessage(content=human_content)
                    prompt_messages = [system_message, human_message]

                    structured_llm = self.llm.with_structured_output(self.MarkdownArticle)
                    generated_article = structured_llm.invoke(prompt_messages)
                    logger.info(f"Task {self.task_id}: Generated article for {video_url}")

                    if generated_article and isinstance(generated_article, dict) and "content" in generated_article:
                        markdown_content = generated_article["content"]
                        frame_pattern = r'!\[.*?\]\((frame_\d+)\)'
                        mentioned_frames = set(re.findall(frame_pattern, markdown_content))

                        frame_to_url = {}
                        for frame in mentioned_frames:
                            image_path = os.path.join(temp_dir, f"{frame}_original.jpg")
                            if os.path.exists(image_path):
                                try:
                                    public_url = get_public_url(image_path, self.organization_id)
                                    frame_to_url[frame] = public_url
                                    logger.info(f"Task {self.task_id}: Uploaded {frame}_original.jpg to {public_url}")
                                except Exception as e:
                                    logger.error(f"Task {self.task_id}: Failed to upload {image_path}: {e}")
                            else:
                                logger.warning(f"Task {self.task_id}: Unprocessed frame {frame}_original.jpg not found")

                        # Replace frame placeholders with public URLs
                        def replace_frame_with_url(match):
                            frame = match.group(1)
                            public_url = frame_to_url.get(frame, frame)
                            # Extract alt text from the match
                            alt_text = match.group(0).split('[')[1].split(']')[0]
                            return f"![{alt_text}]({public_url})"
                        markdown_content = re.sub(frame_pattern, replace_frame_with_url, markdown_content)
                        generated_article["content"] = markdown_content
                        logger.info(f"Task {self.task_id}: Generated article for {video_url}: {generated_article}")
                        articles.append(generated_article)
                    else:
                        logger.warning(f"Task {self.task_id}: Generated article missing content for {video_url}")

                    logger.info(f"Task {self.task_id}: Uploaded frames for {video_url}")

            except Exception as e:
                logger.error(f"Task {self.task_id}: Error processing video {video_url}: {e}")
                continue
            
            finally:
                if 'video_path' in locals():
                    try:
                        os.remove(video_path)
                        logger.info(f"Task {self.task_id}: Cleaned up temporary file {video_path}")
                    except Exception as e:
                        logger.warning(f"Task {self.task_id}: Failed to delete {video_path}: {e}")

        return articles