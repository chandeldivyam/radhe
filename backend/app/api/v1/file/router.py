from fastapi import APIRouter, Depends, HTTPException
from app.schemas.file import PresignedURLResponse
from app.api.utils.deps import get_current_user
from app.api.v1.file.service import FileService
import logging

router = APIRouter(prefix="/files")
logger = logging.getLogger(__name__)

@router.get("/presigned-url", response_model=PresignedURLResponse)
async def get_presigned_upload_url(
    file_key: str,
    content_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate a pre-signed URL for uploading a file"""
    try:
        result = await FileService.get_presigned_upload_url(
            file_key=file_key,
            content_type=content_type,
            bucket_name="radhe-bucket"
        )
        return result
    except Exception as e:
        logger.error(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

