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
