from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from app.core.storage import MinioClient
import uuid
from datetime import datetime
import io

router = APIRouter()
minio_client = MinioClient()

@router.post("/upload/")
async def upload_file(file: UploadFile = File(...), bucket: str = "default"):
    try:
        # Read file content
        file_content = await file.read()
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4()}.{file_extension}"
        
        # Upload to MinIO
        minio_client.upload_file(
            bucket_name=bucket,
            object_name=unique_filename,
            file_data=file_content,
            content_type=file.content_type
        )
        
        return {
            "filename": unique_filename,
            "bucket": bucket,
            "content_type": file.content_type,
            "size": len(file_content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{bucket}/{filename}")
async def download_file(bucket: str, filename: str):
    try:
        file_data = minio_client.get_file(bucket, filename)
        
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{bucket}/{filename}")
async def delete_file(bucket: str, filename: str):
    try:
        minio_client.delete_file(bucket, filename)
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))