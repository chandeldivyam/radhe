# we need to add the router to the main app
from app.api.v1.auth.router import router

__all__ = ["router"]