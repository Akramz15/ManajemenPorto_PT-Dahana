from pydantic import BaseModel


class UploadResponse(BaseModel):
    file_name: str
    storage_path: str
    file_size: int
    project_id: str
    message: str
