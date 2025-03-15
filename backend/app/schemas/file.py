from pydantic import BaseModel

class PresignedURLRequest(BaseModel):
    file_name: str
    content_type: str

class PresignedURLResponse(BaseModel):
    presigned_url: str
    public_url: str
    file_key: str

class FileMetadata(BaseModel):
    file_key: str
    file_name: str
    size: int
    last_modified: str
    public_url: str