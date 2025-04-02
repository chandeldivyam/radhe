# ./backend/app/services/llm/factory.py
import logging
from typing import Dict, Any

# Langchain Imports
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import AzureChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

# Local Imports
from app.api.utils.constants import LLMS_AVAILABLE
from app.core.config import settings

logger = logging.getLogger(__name__)

def initialize_llm(llm_provider: str, llm_model: str) -> BaseChatModel:
    """
    Initializes and returns a Langchain LLM client based on the specified provider and model.

    Args:
        llm_provider: The name of the LLM provider (e.g., "azure_openai", "gemini").
        llm_model: The name of the specific model to use (e.g., "gpt-4", "gemini-pro").

    Returns:
        An initialized Langchain BaseChatModel instance.

    Raises:
        ValueError: If the provider or model is unsupported, or if required settings are missing.
        RuntimeError: If the LLM client fails to initialize for other reasons.
    """
    logger.info(f"Initializing LLM: Provider='{llm_provider}', Model='{llm_model}'")

    provider_config = LLMS_AVAILABLE.get(llm_provider)
    if not provider_config:
        logger.error(f"Unsupported LLM provider specified: {llm_provider}")
        raise ValueError(f"Unsupported LLM provider specified: {llm_provider}")

    model_params = provider_config.get(llm_model)
    if not model_params:
        logger.error(f"Unsupported LLM model '{llm_model}' for provider '{llm_provider}'")
        raise ValueError(f"Unsupported LLM model '{llm_model}' for provider '{llm_provider}'")

    llm_client: BaseChatModel = None

    try:
        if llm_provider == "azure_openai":
            # Check Azure specific settings
            if not settings.AZURE_OPENAI_ENDPOINT:
                raise ValueError("AZURE_OPENAI_ENDPOINT is not set in settings for Azure provider")
            if not settings.AZURE_OPENAI_API_KEY:
                raise ValueError("AZURE_OPENAI_API_KEY is not set in settings for Azure provider")

            deployment_name = model_params.get("AZURE_OPENAI_DEPLOYMENT_NAME")
            api_version = model_params.get("AZURE_OPENAI_API_VERSION")

            if not deployment_name:
                 raise ValueError(f"Missing 'AZURE_OPENAI_DEPLOYMENT_NAME' in LLMS_AVAILABLE config for {llm_provider}/{llm_model}")
            if not api_version:
                 raise ValueError(f"Missing 'AZURE_OPENAI_API_VERSION' in LLMS_AVAILABLE config for {llm_provider}/{llm_model}")


            llm_client = AzureChatOpenAI(
                azure_deployment=deployment_name,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=api_version,
                # You might want to pass other common parameters like temperature, max_tokens here
                # temperature=model_params.get("temperature", 0.7), # Example
            )
            logger.info(f"Initialized AzureChatOpenAI for deployment '{deployment_name}'")

        elif llm_provider == "gemini":
            # Check Gemini specific settings
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not set in settings for Gemini provider")

            model_name = model_params.get("MODEL")
            if not model_name:
                 raise ValueError(f"Missing 'MODEL' in LLMS_AVAILABLE config for {llm_provider}/{llm_model}")

            llm_client = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=settings.GEMINI_API_KEY,
                convert_system_message_to_human=True, # Specific to Gemini Chat model
                # Add other parameters if needed
                # temperature=model_params.get("temperature", 0.7), # Example
            )
            logger.info(f"Initialized ChatGoogleGenerativeAI for model '{model_name}'")

        else:
            # This case should ideally not be reached if validation is correct, but good for safety
            logger.error(f"LLM provider '{llm_provider}' is configured but not implemented in the factory.")
            raise ValueError(f"LLM provider '{llm_provider}' is configured but not implemented in the factory.")

    except Exception as e:
        logger.error(f"Failed to initialize LLM client for {llm_provider}/{llm_model}: {e}", exc_info=True)
        # Re-raise a more specific error or a generic one depending on desired handling
        raise RuntimeError(f"Failed to initialize LLM client for {llm_provider}/{llm_model}") from e

    return llm_client