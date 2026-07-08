# Modul 07 — Mesin Ekstraksi Data Python (Excel Parser)

## 1. Prinsip Utama

Parser Excel Dahana BizPort harus memenuhi kriteria:
1. **Zero-error parsing** — tidak boleh silently fail; gagal keras dengan pesan jelas
2. **Format Indonesia** — menangani `,` sebagai pemisah desimal dan `.` sebagai pemisah ribuan
3. **Sheet name detection** — scan nama sheet secara fleksibel (case-insensitive, partial match)
4. **Reproducibility** — output JSON harus deterministik untuk input yang sama

---

## 2. Normalizer (Inti Parser)

```python
# app/parsers/normalizer.py
import re
from decimal import Decimal, InvalidOperation

def normalize_indonesian_number(raw: str | int | float | None) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)

    text = str(raw).strip()

    if not text or text in ("-", "–", "—", "N/A", "n/a", ""):
        return None

    text = re.sub(r"[Rp\s]", "", text)
    text = re.sub(r"[()]", "", text)

    comma_count = text.count(",")
    dot_count = text.count(".")

    if comma_count == 1 and dot_count > 0:
        last_comma = text.rfind(",")
        last_dot = text.rfind(".")
        if last_comma > last_dot:
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif comma_count > 1:
        text = text.replace(",", "")
    elif comma_count == 1 and dot_count == 0:
        parts = text.split(",")
        if len(parts[1]) <= 2:
            text = text.replace(",", ".")
        else:
            text = text.replace(",", "")
    elif dot_count > 1:
        text = text.replace(".", "")

    try:
        return float(Decimal(text))
    except InvalidOperation:
        return None


def normalize_row(row: dict, numeric_keys: list[str]) -> dict:
    return {
        k: normalize_indonesian_number(v) if k in numeric_keys else v
        for k, v in row.items()
    }
```

---

## 3. Base Parser

```python
# app/parsers/base_parser.py
import io
import pandas as pd
from abc import ABC, abstractmethod


class BaseExcelParser(ABC):
    def __init__(self, file_bytes: io.BytesIO, context: str):
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
```

---

## 4. Kurva S Parser

```python
# app/parsers/kurva_s_parser.py
import pandas as pd
from app.parsers.base_parser import BaseExcelParser
from app.parsers.normalizer import normalize_indonesian_number


class KurvaSParser(BaseExcelParser):
    SHEET_KEYWORDS = ["kurva s", "kurva-s", "progress", "s-curve"]
    RENCANA_KEYWORDS = ["rencana", "plan", "target"]
    REALISASI_KEYWORDS = ["realisasi", "actual", "aktual"]
    PERIODE_KEYWORDS = ["periode", "bulan", "month", "minggu", "week"]

    def parse(self) -> dict:
        sheet_name = self._find_sheet(self.SHEET_KEYWORDS)
        df = self._read_sheet(sheet_name)

        periode_col = self._find_column(df, self.PERIODE_KEYWORDS)
        rencana_col = self._find_column(df, self.RENCANA_KEYWORDS)
        realisasi_col = self._find_column(df, self.REALISASI_KEYWORDS)

        df_clean = df[[periode_col, rencana_col, realisasi_col]].copy()
        df_clean.columns = ["periode", "rencana", "realisasi"]
        df_clean = df_clean.dropna(subset=["periode"])

        data_points = []
        for _, row in df_clean.iterrows():
            rencana = normalize_indonesian_number(row["rencana"])
            realisasi = normalize_indonesian_number(row["realisasi"])

            if rencana is None and realisasi is None:
                continue

            data_points.append({
                "periode": str(row["periode"]).strip(),
                "rencana": round(rencana, 2) if rencana is not None else None,
                "realisasi": round(realisasi, 2) if realisasi is not None else None,
            })

        if not data_points:
            raise ValueError("Tidak ada data valid ditemukan di sheet Kurva S")

        return {
            "chart_type": "kurva_s",
            "data_points": data_points,
            "sheet_used": sheet_name,
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
```

---

## 5. Portfolio Parser

```python
# app/parsers/portofolio_parser.py
import pandas as pd
from app.parsers.base_parser import BaseExcelParser
from app.parsers.normalizer import normalize_indonesian_number

CONTEXT_SHEET_MAP = {
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

NUMERIC_COLS_PNL = ["penjualan", "hpp", "laba_kotor", "laba_bersih", "sales", "cogs"]
NUMERIC_COLS_NERACA = ["aset_lancar", "aset_tidak_lancar", "total_aset", "kewajiban", "ekuitas"]
NUMERIC_COLS_CASHFLOW = ["penerimaan", "pengeluaran", "net_cashflow"]
NUMERIC_COLS_INVENTORI = ["stok_awal", "produksi", "pengeluaran", "stok_akhir"]


class PortofolioParser(BaseExcelParser):
    def parse(self) -> dict:
        context = self.context.lower()
        if context not in CONTEXT_SHEET_MAP:
            raise ValueError(f"Context '{context}' tidak didukung oleh PortofolioParser")

        sheet_config = CONTEXT_SHEET_MAP[context]
        result: dict = {"chart_type": context, "sheets": {}}

        for data_key, keywords in sheet_config.items():
            try:
                sheet_name = self._find_sheet(keywords)
                df = self._read_sheet(sheet_name)
                df = self._clean_dataframe(df)
                result["sheets"][data_key] = {
                    "sheet_name": sheet_name,
                    "data": self._serialize_df(df, data_key),
                }
            except ValueError as e:
                result["sheets"][data_key] = {"error": str(e), "data": []}

        return result

    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.dropna(how="all")
        df = df.dropna(axis=1, how="all")
        df.columns = [
            str(c).strip().lower().replace(" ", "_").replace("/", "_")
            for c in df.columns
        ]
        return df

    def _serialize_df(self, df: pd.DataFrame, data_key: str) -> list[dict]:
        numeric_map = {
            "pnl": NUMERIC_COLS_PNL,
            "neraca": NUMERIC_COLS_NERACA,
            "cash_flow": NUMERIC_COLS_CASHFLOW,
            "inventori": NUMERIC_COLS_INVENTORI,
        }
        numeric_keys = numeric_map.get(data_key, [])

        rows = []
        for _, row in df.iterrows():
            serialized = {}
            for col, val in row.items():
                if any(nk in str(col) for nk in numeric_keys):
                    serialized[col] = normalize_indonesian_number(val)
                else:
                    serialized[col] = None if pd.isna(val) else str(val)
            rows.append(serialized)

        return rows
```

---

## 6. Validator

```python
# app/parsers/validators.py
import io
import openpyxl

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

def validate_excel_file(file_bytes: io.BytesIO, filename: str) -> None:
    file_bytes.seek(0, 2)
    size = file_bytes.tell()
    file_bytes.seek(0)

    if size > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"Ukuran file ({size // 1024 // 1024} MB) melebihi batas 20 MB")

    if not filename.lower().endswith((".xlsx", ".xls")):
        raise ValueError("Format file harus .xlsx atau .xls")

    try:
        wb = openpyxl.load_workbook(file_bytes, read_only=True, data_only=True)
        if not wb.sheetnames:
            raise ValueError("File Excel tidak memiliki sheet")
        file_bytes.seek(0)
    except Exception as e:
        raise ValueError(f"File Excel tidak dapat dibaca: {str(e)}")
```

---

## 7. Unit Tests

```python
# tests/test_parsers/test_normalizer.py
import pytest
from app.parsers.normalizer import normalize_indonesian_number

@pytest.mark.parametrize("raw,expected", [
    ("1.234.567,89", 1234567.89),
    ("1,234,567.89", 1234567.89),
    ("45,2", 45.2),
    ("45.2", 45.2),
    ("1.000", 1000.0),
    ("Rp 5.000.000", 5000000.0),
    (1000, 1000.0),
    (None, None),
    ("N/A", None),
    ("-", None),
])
def test_normalize(raw, expected):
    result = normalize_indonesian_number(raw)
    assert result == expected
```

---

## 📌 Prompt AI — Modul 07

```
Bangun mesin ekstraksi Excel untuk Dahana BizPort menggunakan Python
(pandas + openpyxl).

Requirements kritis:
1. Normalizer harus menangani semua format angka Indonesia:
   - "1.234.567,89" → 1234567.89 (titik = ribuan, koma = desimal)
   - "1.000" → 1000 (titik = ribuan jika tidak ada koma)
   - "Rp 5.000.000" → 5000000 (strip prefix mata uang)
   - "-", "N/A", None → None (nilai kosong)
2. KurvaSParser harus mencari sheet secara fleksibel (case-insensitive)
   dan menemukan kolom periode/rencana/realisasi dengan keyword matching
3. PortofolioParser harus handle parsing per-context (dic, kan, jodd, jodb)
   dan tidak crash jika satu sheet tidak ditemukan (soft error per sheet)
4. Validator harus cek ukuran file (max 20MB) dan validitas format Excel
5. Semua parser raise ValueError dengan pesan Indonesian yang informatif

Buatkan semua file beserta unit test untuk normalizer dengan pytest.
Kode clean, production-ready.
```
