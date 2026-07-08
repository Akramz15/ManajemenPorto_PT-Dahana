import io
import pandas as pd
from abc import ABC, abstractmethod


class BaseExcelParser(ABC):
    def __init__(self, file_bytes: io.BytesIO, context: str) -> None:
        self.file_bytes = file_bytes
        self.context = context
        self._xl: pd.ExcelFile | None = None

    def _open(self) -> pd.ExcelFile:
        if self._xl is None:
            self._xl = pd.ExcelFile(self.file_bytes, engine="openpyxl")
        return self._xl

    def _find_sheet(self, keywords: list[str]) -> str:
        xl = self._open()
        for sheet in xl.sheet_names:
            for kw in keywords:
                if kw.lower() in sheet.lower():
                    return sheet
        available = ", ".join(xl.sheet_names)
        raise ValueError(
            f"Sheet dengan kata kunci {keywords} tidak ditemukan. "
            f"Sheet tersedia: {available}"
        )

    def _read_sheet(self, sheet_name: str, header_row: int = 0, **kwargs) -> pd.DataFrame:
        xl = self._open()
        df = pd.read_excel(xl, sheet_name=sheet_name, header=header_row, **kwargs)
        df.columns = [str(c).strip() for c in df.columns]
        return df

    @abstractmethod
    def parse(self) -> dict:
        ...
