from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.routes import extract, upload, charts, progress

app = FastAPI(
    title="Dahana BizPort API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

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


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "Dahana BizPort API"}
