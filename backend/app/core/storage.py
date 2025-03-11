from minio import Minio
from app.core.config import settings
import logging
import io
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List
import json

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

class StorageService:
    def __init__(self, bucket_name: str):
        """Initialize the storage service with MinIO/S3 client"""
        if not bucket_name:
            raise ValueError("Bucket name is required")
        self.bucket_name = bucket_name
        self.region_name = "us-east-1"
        self.endpoint_url = f"http://{settings.MINIO_HOST}:{settings.MINIO_PORT}"
        
        # Configure the client using settings
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            region_name=self.region_name,
            config=boto3.session.Config(signature_version='s3v4')
        )
        
        # Ensure bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, creating it if necessary"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket {self.bucket_name} already exists")
            
            # Check if policy exists for existing bucket
            try:
                self.s3_client.get_bucket_policy(Bucket=self.bucket_name)
                logger.info(f"Bucket {self.bucket_name} already has a policy")
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchBucketPolicy':
                    # No policy exists, set it
                    self._set_bucket_policy()
        except ClientError:
            logger.info(f"Creating bucket {self.bucket_name}")
            self.s3_client.create_bucket(Bucket=self.bucket_name)
            
            # Set CORS policy
            self._set_cors_policy()
            
            # Set bucket policy
            self._set_bucket_policy()

    def _set_cors_policy(self):
        """Set CORS policy for the bucket"""
        cors_configuration = {
            'CORSRules': [{
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE'],
                'AllowedOrigins': ['*'],
                'MaxAgeSeconds': 3000
            }]
        }
        
        try:
            self.s3_client.put_bucket_cors(
                Bucket=self.bucket_name,
                CORSConfiguration=cors_configuration
            )
            logger.info("CORS policy set successfully")
        except ClientError as e:
            # Log but don't fail if CORS setting fails
            logger.warning(f"Could not set CORS policy: {str(e)}")

    def _set_bucket_policy(self):
        """Set public read policy for the bucket"""
        try:
            bucket_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                        "Resource": [f"arn:aws:s3:::{self.bucket_name}"]
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"]
                    }
                ]
            }
            
            policy_str = json.dumps(bucket_policy)
            
            # Set the bucket policy
            self.s3_client.put_bucket_policy(
                Bucket=self.bucket_name,
                Policy=policy_str
            )
            
            # Verify the policy was set correctly
            policy_response = self.s3_client.get_bucket_policy(Bucket=self.bucket_name)
            set_policy = json.loads(policy_response['Policy'])
            logger.info(f"Set bucket policy: {set_policy}")
            
        except ClientError as e:
            logger.error(f"Failed to set bucket policy: {str(e)}")
            raise
    
    def generate_presigned_upload_url(
        self, 
        file_key: str, 
        content_type: str
    ) -> Dict[str, str]:
        """Generate a pre-signed URL for uploading a file"""
        
        try:
            # Generate the presigned URL for upload (PUT)
            presigned_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_key,
                    'ContentType': content_type
                },
                ExpiresIn=3600,  # URL expires in 1 hour
                HttpMethod='PUT'
            )
            
            # Also generate a public URL for later retrieval
            public_url = self.get_public_url(file_key)
            
            return {
                "presigned_url": presigned_url,
                "public_url": public_url,
                "file_key": file_key
            }
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def get_public_url(self, file_key: str) -> str:
        """Get a public URL for accessing the file"""
        # Ensure the file_key doesn't start with a slash
        if file_key.startswith("/"):
            # throw an error
            raise ValueError("File key cannot start with a slash")
        return f"{self.endpoint_url}/{self.bucket_name}/{file_key}"
    
    def get_presigned_download_url(self, file_key: str, expiration: int = 3600) -> str:
        """Generate a pre-signed URL for downloading a file"""
        try:
            return self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_key
                },
                ExpiresIn=expiration
            )
        except ClientError as e:
            logger.error(f"Error generating presigned download URL: {e}")
            raise
    
    def delete_file(self, file_key: str) -> bool:
        """Delete a file from storage"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return True
        except ClientError as e:
            logger.error(f"Error deleting file {file_key}: {e}")
            return False
    
    def list_files(self, prefix: str) -> List[Dict]:
        """List files with a given prefix (e.g., for a specific note)"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    files.append({
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat(),
                        'public_url': self.get_public_url(obj['Key'])
                    })
            
            return files
        except ClientError as e:
            logger.error(f"Error listing files with prefix {prefix}: {e}")
            raise