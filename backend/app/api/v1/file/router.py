from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.schemas.file import PresignedURLResponse, DirectUploadResponse
from app.api.utils.deps import get_current_user
from app.api.v1.file.service import FileService
import logging
import uuid

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

# we are creating this endpoint for our external upload and testing, hence not authenticating
@router.post("/upload", response_model=DirectUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    bucket_name: str = Form("direct-upload"),
):
    """Upload a file directly to storage through the API"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Generate a unique file key
        file_key = f"{uuid.uuid4()}"
        
        # Upload the file
        result = await FileService.upload_file_direct(
            file_data=file_content,
            file_key=file_key,
            content_type=file.content_type,
            bucket_name=bucket_name
        )
        
        return result
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
