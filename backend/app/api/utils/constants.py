ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 900
REFRESH_TOKEN_EXPIRE_DAYS = 7

# LLM
LLMS_AVAILABLE = {
    "azure_openai": {
        "gpt-4o-mini": {
            "AZURE_OPENAI_API_VERSION": "2025-01-01-preview",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o-mini",
        },
        "gpt-4o": {
            "AZURE_OPENAI_API_VERSION": "2025-01-01-preview",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o",
        },
        "o3-mini": {
            "AZURE_OPENAI_API_VERSION": "2024-12-01-preview",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "o3-mini",
        },
    },
    "gemini": {
        "gemini-2.0-flash": {
            "MODEL": "gemini-2.0-flash",
        }
    }
}