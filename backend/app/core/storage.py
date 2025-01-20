from minio import Minio
from app.core.config import settings
import logging
import io

logger = logging.getLogger(__name__)

class MinioClient:
    def __init__(self):
        self.client = Minio(
            f"{settings.MINIO_HOST}:{settings.MINIO_PORT}",
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=False  # Set to True if using HTTPS
        )

    def create_bucket_if_not_exists(self, bucket_name: str):
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"Created bucket: {bucket_name}")
            return True
        except Exception as e:
            logger.error(f"Error creating bucket {bucket_name}: {str(e)}")
            raise

    def upload_file(self, bucket_name: str, object_name: str, file_data: bytes, content_type: str):
        try:
            self.create_bucket_if_not_exists(bucket_name)
            self.client.put_object(
                bucket_name,
                object_name,
                io.BytesIO(file_data),  # Wrap bytes in BytesIO
                length=len(file_data),
                content_type=content_type
            )
            return True
        except Exception as e:
            logger.error(f"Error uploading file {object_name}: {str(e)}")
            raise


    def get_file(self, bucket_name: str, object_name: str):
        try:
            response = self.client.get_object(bucket_name, object_name)
            return response.read()  # Read the data before returning
        except Exception as e:
            logger.error(f"Error retrieving file {object_name}: {str(e)}")
            raise


    def delete_file(self, bucket_name: str, object_name: str):
        try:
            self.client.remove_object(bucket_name, object_name)
            return True
        except Exception as e:
            logger.error(f"Error deleting file {object_name}: {str(e)}")
            raise