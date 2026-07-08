import io
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query
from app.api.deps import get_current_user
from app.parsers.kurva_s_parser import KurvaSParser
from app.parsers.portofolio_parser import PortofolioParser
from app.parsers.laba_rugi_parser import LabaRugiParser
from app.parsers.validators import validate_excel_file
from app.services.supabase_service import SupabaseService
from app.models.chart import ChartResponse

router = APIRouter()

_PARSER_MAP = {
    "kurva-s": KurvaSParser,
    "dic": PortofolioParser,
    "kan": PortofolioParser,
    "jodd": PortofolioParser,
    "jodb": PortofolioParser,
    "laba-rugi": LabaRugiParser,
}


@router.post("/{context}", response_model=ChartResponse)
async def extract_excel(
    context: str,
    sub_context: str | None = Query(None),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if context not in _PARSER_MAP:
        raise HTTPException(status_code=400, detail=f"Context '{context}' tidak dikenal")

    content = await file.read()
    file_bytes = io.BytesIO(content)

    try:
        validate_excel_file(file_bytes, file.filename or "upload.xlsx")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    parser_class = _PARSER_MAP[context]
    parser = parser_class(file_bytes=file_bytes, context=context)

    try:
        result = parser.parse()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    svc = SupabaseService()
    svc.save_chart_data(
        context=context,
        sub_context=sub_context,
        data_json=result,
        source_file=file.filename or "upload.xlsx",
        uploaded_by=user["user_id"],
    )

    return ChartResponse(context=context, data=result, uploaded_by=user["user_id"])
