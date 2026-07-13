import io

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.api.deps import get_current_user
from app.models.chart import ChartResponse
from app.parsers.kurva_s_parser import KurvaSParser
from app.parsers.laba_rugi_parser import LabaRugiParser
from app.parsers.portofolio_parser import PortofolioParser
from app.parsers.validators import validate_excel_file
from app.services.supabase_service import SupabaseService

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

    svc = SupabaseService()

    if context in ["dic", "kan", "jodb", "jodd"]:
        contexts_to_parse = ["dic", "kan", "jodb", "jodd"]
        primary_result = None
        for ctx in contexts_to_parse:
            file_bytes.seek(0)
            try:
                parser = PortofolioParser(file_bytes=file_bytes, context=ctx)
                res = parser.parse()
                if ctx == context:
                    primary_result = res
                svc.save_chart_data(
                    context=ctx,
                    sub_context=sub_context,
                    data_json=res,
                    source_file=file.filename or "upload.xlsx",
                    uploaded_by=user["user_id"],
                )
            except Exception:
                # Lanjutkan ke context lain jika salah satu gagal
                continue

        if not primary_result:
            raise HTTPException(status_code=422, detail="Gagal memproses data untuk context ini.")

        return ChartResponse(context=context, data=primary_result, uploaded_by=user["user_id"])
    else:
        # Untuk kurva-s dan laba-rugi
        parser_class = _PARSER_MAP[context]
        parser = parser_class(file_bytes=file_bytes, context=context)

        try:
            result = parser.parse()
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        svc.save_chart_data(
            context=context,
            sub_context=sub_context,
            data_json=result,
            source_file=file.filename or "upload.xlsx",
            uploaded_by=user["user_id"],
        )

        return ChartResponse(context=context, data=result, uploaded_by=user["user_id"])
