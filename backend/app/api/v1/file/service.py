# app/api/v1/file/service.py
from sqlalchemy.orm import Session
from app.core.storage import StorageService
from app.schemas.file import PresignedURLResponse, FileMetadata
import logging
from typing import List, Dict
import uuid

logger = logging.getLogger(__name__)

class FileService:
    @staticmethod
    async def get_presigned_upload_url(
        file_key: str, 
        content_type: str,
        bucket_name: str
    ) -> PresignedURLResponse:
        """Generate a pre-signed URL for uploading a file"""
        # Generate the presigned URL
        storage_service = StorageService(bucket_name=bucket_name)
        result = storage_service.generate_presigned_upload_url(file_key, content_type)
        
        return PresignedURLResponse(
            presigned_url=result["presigned_url"],
            public_url=result["public_url"],
            file_key=file_key
        )

