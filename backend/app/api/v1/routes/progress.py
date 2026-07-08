from fastapi import APIRouter, Depends, Body, HTTPException
from app.api.deps import get_current_user
from app.services.supabase_service import SupabaseService

router = APIRouter()

_VALID_STATUSES = {"not_started", "in_progress", "done", "blocked"}


@router.get("/{project_id}")
async def get_progress(project_id: str, user: dict = Depends(get_current_user)):
    svc = SupabaseService()
    return svc.get_progress_tasks(project_id)


@router.patch("/{task_id}")
async def update_task_status(
    task_id: str,
    payload: dict = Body(...),
    user: dict = Depends(get_current_user),
):
    status = payload.get("status")
    if status and status not in _VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Status tidak valid. Pilihan: {_VALID_STATUSES}",
        )
    svc = SupabaseService()
    result = svc.update_task(task_id, payload, user["user_id"])
    if not result:
        raise HTTPException(
            status_code=403,
            detail="Tidak dapat memperbarui task ini. Pastikan task milik Anda.",
        )
    return result[0]
