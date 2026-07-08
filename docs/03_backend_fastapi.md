# Modul 03 — Backend Python FastAPI

## 1. Arsitektur Backend

```
backend/app/
├── main.py              ← Entry point, CORS, router registration
├── core/
│   ├── config.py        ← Environment settings
│   └── security.py      ← JWT validation dari Supabase
├── api/
│   ├── deps.py          ← Dependency: get_current_user
│   └── v1/routes/
│       ├── extract.py   ← POST /api/v1/extract/{context}
│       ├── upload.py    ← POST /api/v1/upload
│       ├── charts.py    ← GET /api/v1/charts/{context}
│       └── progress.py  ← GET/POST/PATCH /api/v1/progress
├── parsers/
│   ├── base_parser.py
│   ├── kurva_s_parser.py
│   ├── portofolio_parser.py
│   ├── normalizer.py
│   └── validators.py
├── models/
│   ├── chart.py
│   └── upload.py
└── services/
    ├── supabase_service.py
    └── storage_service.py
```

---

## 2. Entry Point (main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.routes import extract, upload, charts, progress

app = FastAPI(title="Dahana BizPort API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract.router, prefix="/api/v1/extract", tags=["extract"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
app.include_router(charts.router, prefix="/api/v1/charts", tags=["charts"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

---

## 3. Core Config & Security

### 3.1 config.py
```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    allowed_origins: list[str] = ["http://localhost:5173"]

settings = Settings()
```

### 3.2 security.py
```python
from jose import jwt, JWTError
from fastapi import HTTPException, status

ALGORITHM = "HS256"

def verify_supabase_jwt(token: str, jwt_secret: str) -> dict:
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[ALGORITHM],
                             options={"verify_aud": False})
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau expired"
        )
```

---

## 4. Dependency Injection

```python
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_supabase_jwt
from app.core.config import settings

bearer = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
) -> dict:
    token = credentials.credentials
    payload = verify_supabase_jwt(token, settings.supabase_jwt_secret)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User tidak teridentifikasi")
    return {"user_id": user_id, "email": payload.get("email")}
```

---

## 5. Endpoints

### 5.1 Extract Endpoint
```python
# app/api/v1/routes/extract.py
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from app.api.deps import get_current_user
from app.parsers.kurva_s_parser import KurvaSParser
from app.parsers.portofolio_parser import PortofolioParser
from app.models.chart import ChartResponse
import io

router = APIRouter()

PARSER_MAP = {
    "kurva-s": KurvaSParser,
    "dic": PortofolioParser,
    "kan": PortofolioParser,
    "jodd": PortofolioParser,
    "jodb": PortofolioParser,
}

@router.post("/{context}", response_model=ChartResponse)
async def extract_excel(
    context: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if context not in PARSER_MAP:
        raise HTTPException(status_code=400, detail=f"Context '{context}' tidak dikenal")

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=422, detail="File harus berformat Excel (.xlsx/.xls)")

    content = await file.read()
    parser_class = PARSER_MAP[context]
    parser = parser_class(file_bytes=io.BytesIO(content), context=context)

    try:
        result = parser.parse()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return ChartResponse(context=context, data=result, uploaded_by=user["user_id"])
```

### 5.2 Charts Endpoint
```python
# app/api/v1/routes/charts.py
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.services.supabase_service import SupabaseService

router = APIRouter()

@router.get("/{context}")
async def get_chart_data(
    context: str,
    sub_context: str | None = Query(None),
    user: dict = Depends(get_current_user)
):
    svc = SupabaseService()
    data = await svc.get_chart_data(context=context, sub_context=sub_context)
    return data
```

### 5.3 Progress Endpoint
```python
# app/api/v1/routes/progress.py
from fastapi import APIRouter, Depends, Body
from app.api.deps import get_current_user
from app.services.supabase_service import SupabaseService

router = APIRouter()

@router.get("/{project_id}")
async def get_progress(project_id: str, user: dict = Depends(get_current_user)):
    svc = SupabaseService()
    return await svc.get_progress_tasks(project_id)

@router.patch("/{task_id}")
async def update_task_status(
    task_id: str,
    payload: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    svc = SupabaseService()
    return await svc.update_task(task_id, payload, user["user_id"])
```

---

## 6. Pydantic Models

```python
# app/models/chart.py
from pydantic import BaseModel
from typing import Any

class ChartResponse(BaseModel):
    context: str
    data: dict[str, Any]
    uploaded_by: str

class ChartDataPoint(BaseModel):
    label: str
    plan: float | None = None
    actual: float | None = None
    value: float | None = None
```

---

## 7. Supabase Service

```python
# app/services/supabase_service.py
from supabase import create_client, Client
from app.core.config import settings

class SupabaseService:
    def __init__(self):
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )

    async def get_chart_data(self, context: str, sub_context: str | None):
        query = self._client.table("chart_data").select("*").eq("context", context)
        if sub_context:
            query = query.eq("sub_context", sub_context)
        result = query.order("created_at", desc=True).limit(1).execute()
        return result.data[0] if result.data else None

    async def save_chart_data(self, context: str, sub_context: str | None,
                               data_json: dict, uploaded_by: str):
        self._client.table("chart_data").insert({
            "context": context,
            "sub_context": sub_context,
            "data_json": data_json,
            "uploaded_by": uploaded_by,
        }).execute()

    async def get_progress_tasks(self, project_id: str):
        result = self._client.table("progress_tasks")             .select("*, user_profiles(display_name, avatar_url)")             .eq("project_id", project_id).execute()
        return result.data

    async def update_task(self, task_id: str, payload: dict, user_id: str):
        result = self._client.table("progress_tasks")             .update({**payload, "updated_at": "now()"})             .eq("id", task_id).eq("assigned_to", user_id).execute()
        return result.data
```

---

## 8. Menjalankan Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

Dokumentasi API otomatis tersedia di: `http://localhost:8000/docs`

---

## 📌 Prompt AI — Modul 03

```
Bangun backend FastAPI lengkap untuk Dahana BizPort.

Requirements:
- JWT validation menggunakan Supabase JWT secret (HS256)
- Semua endpoint memerlukan Bearer token yang valid
- Endpoint POST /api/v1/extract/{context} menerima file Excel multipart
  dan mengembalikan JSON chart data
- Endpoint GET /api/v1/charts/{context} mengambil data terbaru dari Supabase
- Endpoint PATCH /api/v1/progress/{task_id} memperbarui status task
- Supabase service menggunakan service role key (bukan anon key)
- Semua error responses menggunakan format standar FastAPI HTTPException

Buatkan semua file berikut secara lengkap:
1. app/main.py
2. app/core/config.py
3. app/core/security.py
4. app/api/deps.py
5. app/api/v1/routes/extract.py
6. app/api/v1/routes/charts.py
7. app/api/v1/routes/progress.py
8. app/models/chart.py
9. app/services/supabase_service.py

Kode harus clean, production-ready, tanpa komentar redundan.
```
