from supabase import Client, create_client

from app.core.config import settings

DOCUMENT_BUCKET = "project-documents"
EXCEL_BUCKET = "excel-uploads"


class StorageService:
    def __init__(self) -> None:
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    def upload_document(self, file_bytes: bytes, path: str, content_type: str) -> str:
        self._client.storage.from_(DOCUMENT_BUCKET).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        return path

    def upload_excel(self, file_bytes: bytes, path: str) -> str:
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        self._client.storage.from_(EXCEL_BUCKET).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return path

    def get_download_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        result = self._client.storage.from_(bucket).create_signed_url(path, expires_in)
        return result.get("signedURL", "")
