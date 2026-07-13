from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.services.supabase_service import SupabaseService

router = APIRouter()


@router.get("/{context}")
async def get_chart_data(
    context: str,
    sub_context: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    svc = SupabaseService()
    data = svc.get_chart_data(context=context, sub_context=sub_context)
    if not data:
        return {"data_json": []}
    return data
