import uuid
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Form
from app.api.deps import get_current_user
from app.services.supabase_service import SupabaseService
from app.services.storage_service import StorageService
from app.models.upload import UploadResponse

router = APIRouter()


@router.post("/document", response_model=UploadResponse)
async def upload_document(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=422, detail="Nama file tidak valid")

    content = await file.read()
    file_size = len(content)

    if file_size > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ukuran file melebihi batas 50 MB")

    storage_path = f"{project_id}/{uuid.uuid4().hex}_{file.filename}"
    content_type = file.content_type or "application/octet-stream"

    try:
        storage_svc = StorageService()
        storage_svc.upload_document(content, storage_path, content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengupload file: {str(e)}")

    svc = SupabaseService()
    svc.save_document(
        {
            "project_id": project_id,
            "storage_path": storage_path,
            "file_name": file.filename,
            "file_size": file_size,
            "uploaded_by": user["user_id"],
        }
    )

    return UploadResponse(
        file_name=file.filename,
        storage_path=storage_path,
        file_size=file_size,
        project_id=project_id,
        message="File berhasil diupload",
    )
