import pandas as pd
from app.parsers.base_parser import BaseExcelParser
from app.parsers.normalizer import normalize_indonesian_number

_CONTEXT_SHEET_MAP: dict[str, dict[str, list[str]]] = {
    "dic": {
        "pnl": ["laba rugi", "p&l", "profit loss", "l/r"],
        "neraca": ["neraca", "balance sheet", "posisi keuangan"],
        "cash_flow": ["arus kas", "cash flow", "cashflow"],
        "rkap": ["rkap", "anggaran", "budget"],
    },
    "kan": {
        "produksi": ["produksi", "production", "an production"],
        "pnl": ["laba rugi", "p&l"],
    },
    "jodd": {
        "inventori": ["inventori", "inventory", "stok", "dayaprime"],
    },
    "jodb": {
        "inventori": ["inventori", "inventory", "ansol", "granular"],
    },
}

_NUMERIC_MAP: dict[str, list[str]] = {
    "pnl": ["penjualan", "hpp", "laba", "sales", "cogs", "revenue"],
    "neraca": ["aset", "kewajiban", "ekuitas", "total", "asset", "liability"],
    "cash_flow": ["penerimaan", "pengeluaran", "net", "cashflow"],
    "rkap": ["rkap", "realisasi", "target", "anggaran"],
    "inventori": ["stok", "produksi", "pengeluaran", "target", "realisasi"],
    "produksi": ["target", "realisasi", "produksi"],
}


class PortofolioParser(BaseExcelParser):
    def parse(self) -> dict:
        ctx = self.context.lower()
        if ctx not in _CONTEXT_SHEET_MAP:
            raise ValueError(f"Context '{ctx}' tidak didukung oleh PortofolioParser")

        result: dict = {"chart_type": ctx, "sheets": {}}

        for data_key, keywords in _CONTEXT_SHEET_MAP[ctx].items():
            try:
                sheet = self._find_sheet(keywords)
                df = self._read_sheet(sheet)
                df = self._clean_df(df)
                result["sheets"][data_key] = {
                    "sheet_name": sheet,
                    "data": self._serialize(df, data_key),
                }
            except ValueError as e:
                result["sheets"][data_key] = {"error": str(e), "data": []}

        return result

    def _clean_df(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.dropna(how="all").dropna(axis=1, how="all")
        df.columns = [
            str(c).strip().lower().replace(" ", "_").replace("/", "_")
            for c in df.columns
        ]
        return df

    def _serialize(self, df: pd.DataFrame, data_key: str) -> list[dict]:
        numeric_keys = _NUMERIC_MAP.get(data_key, [])
        rows = []
        for _, row in df.iterrows():
            serialized: dict = {}
            for col, val in row.items():
                if any(nk in str(col) for nk in numeric_keys):
                    serialized[col] = normalize_indonesian_number(val)
                else:
                    serialized[col] = None if pd.isna(val) else str(val)
            rows.append(serialized)
        return rows
