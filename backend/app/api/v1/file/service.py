# app/api/v1/file/service.py
from sqlalchemy.orm import Session
from app.core.storage import StorageService
from app.schemas.file import PresignedURLResponse, FileMetadata, DirectUploadResponse
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

    @staticmethod
    async def upload_file_direct(
        file_data: bytes,
        file_key: str,
        content_type: str,
        bucket_name: str
    ) -> DirectUploadResponse:
        """Upload a file directly to storage service"""
        try:
            # Initialize storage service
            storage_service = StorageService(bucket_name=bucket_name)
            
            # Upload the file
            storage_service.upload_file(
                file_key=file_key,
                file_data=file_data,
                content_type=content_type
            )
            
            # Get the public URL for the uploaded file
            public_url = storage_service.get_public_url(file_key)
            
            return DirectUploadResponse(
                public_url=public_url,
                file_key=file_key,
                size=len(file_data)
            )
        except Exception as e:
            logger.error(f"Error uploading file directly: {e}")
            raise
