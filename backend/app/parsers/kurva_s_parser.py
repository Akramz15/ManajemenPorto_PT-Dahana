import pandas as pd

from app.parsers.base_parser import BaseExcelParser
from app.parsers.normalizer import normalize_indonesian_number


class KurvaSParser(BaseExcelParser):
    _SHEET_KW = ["kurva s", "kurva-s", "progress", "s-curve", "s curve"]
    _RENCANA_KW = ["rencana", "plan", "target"]
    _REALISASI_KW = ["realisasi", "actual", "aktual"]
    _PERIODE_KW = ["periode", "bulan", "month", "minggu", "week"]

    def parse(self) -> dict:
        sheet = self._find_sheet(self._SHEET_KW)
        df = self._read_sheet(sheet)

        periode_col = self._find_column(df, self._PERIODE_KW)
        rencana_col = self._find_column(df, self._RENCANA_KW)
        realisasi_col = self._find_column(df, self._REALISASI_KW)

        df_clean = df[[periode_col, rencana_col, realisasi_col]].copy()
        df_clean.columns = ["periode", "rencana", "realisasi"]
        df_clean = df_clean.dropna(subset=["periode"])

        data_points = []
        for _, row in df_clean.iterrows():
            rencana = normalize_indonesian_number(row["rencana"])
            realisasi = normalize_indonesian_number(row["realisasi"])

            if rencana is None and realisasi is None:
                continue

            data_points.append(
                {
                    "periode": str(row["periode"]).strip(),
                    "rencana": round(rencana, 2) if rencana is not None else None,
                    "realisasi": round(realisasi, 2) if realisasi is not None else None,
                }
            )

        if not data_points:
            raise ValueError("Tidak ada data valid ditemukan di sheet Kurva S")

        return {
            "chart_type": "kurva_s",
            "data_points": data_points,
            "sheet_used": sheet,
        }

    def _find_column(self, df: pd.DataFrame, keywords: list[str]) -> str:
        for col in df.columns:
            for kw in keywords:
                if kw.lower() in col.lower():
                    return col
        raise ValueError(
            f"Kolom dengan kata kunci {keywords} tidak ditemukan. "
            f"Kolom tersedia: {list(df.columns)}"
        )
