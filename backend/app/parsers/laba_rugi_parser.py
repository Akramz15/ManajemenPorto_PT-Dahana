import pandas as pd
from app.parsers.base_parser import BaseExcelParser
from app.parsers.normalizer import normalize_indonesian_number


class LabaRugiParser(BaseExcelParser):
    _SHEET_KW = [
        "laba rugi",
        "laba",
        "rugi",
        "p&l",
        "profit loss",
        "rkap",
        "realisasi",
        "l/r",
        "sheet1",
    ]

    _MONTHS_MAP = {
        "JAN": "JANUARI",
        "FEB": "FEBRUARI",
        "MAR": "MARET",
        "APR": "APRIL",
        "MEI": "MEI",
        "JUN": "JUNI",
        "JUL": "JULI",
        "AGU": "AGUSTUS",
        "SEP": "SEPTEMBER",
        "OKT": "OKTOBER",
        "NOV": "NOVEMBER",
        "DES": "DESEMBER",
    }

    def _find_all_sheets(self, keywords: list[str]) -> list[str]:
        xl = self._open()
        matched_sheets = []
        for sheet in xl.sheet_names:
            for kw in keywords:
                if kw.lower() in sheet.lower():
                    if sheet not in matched_sheets:
                        matched_sheets.append(sheet)
        return matched_sheets

    def parse(self) -> dict:
        sheets = self._find_all_sheets(self._SHEET_KW)
        if not sheets:
            raise ValueError("Tidak ada sheet Laba Rugi / RKAP yang ditemukan.")

        aggregated = {}
        used_sheets = []

        for sheet in sheets:
            try:
                points = self._parse_single_sheet(sheet)
                used_sheets.append(sheet)
                for p in points:
                    per = p["periode"]
                    if per not in aggregated:
                        aggregated[per] = {"periode": per, "rencana": None, "realisasi": None}

                    if p["rencana"] is not None:
                        aggregated[per]["rencana"] = (aggregated[per]["rencana"] or 0) + p[
                            "rencana"
                        ]
                    if p["realisasi"] is not None:
                        aggregated[per]["realisasi"] = (aggregated[per]["realisasi"] or 0) + p[
                            "realisasi"
                        ]
            except Exception as e:
                pass

        if not aggregated:
            raise ValueError("Tidak dapat mengekstrak data dari sheet manapun.")

        final_points = list(aggregated.values())

        # Round the values
        for p in final_points:
            if p["rencana"] is not None:
                p["rencana"] = round(p["rencana"], 2)
            if p["realisasi"] is not None:
                p["realisasi"] = round(p["realisasi"], 2)

        # Sort by month
        month_order = list(self._MONTHS_MAP.values())
        final_points.sort(
            key=lambda x: month_order.index(x["periode"]) if x["periode"] in month_order else 99
        )

        return {
            "chart_type": "laba-rugi",
            "data_points": final_points,
            "sheet_used": ", ".join(used_sheets),
        }

    def _parse_single_sheet(self, sheet: str) -> list[dict]:
        df_raw = pd.read_excel(self.file_bytes, sheet_name=sheet, header=None)

        # 1. Find the row containing months
        month_row_idx = -1
        for i in range(min(10, len(df_raw))):
            row_vals = [str(x).upper() for x in df_raw.iloc[i].values]
            if any("JANUARI" in val or "JAN" in val for val in row_vals):
                month_row_idx = i
                break

        if month_row_idx == -1:
            raise ValueError("Tidak dapat menemukan baris bulan (Januari, dsb.) di Excel")

        month_row = df_raw.iloc[month_row_idx].values
        subheader_row = df_raw.iloc[month_row_idx + 1].values

        # 2. Find the Laba Bersih / Setelah Pajak row
        laba_row_idx = -1
        for i in range(month_row_idx + 2, len(df_raw)):
            val = str(df_raw.iloc[i, 0]).upper()
            if "LABA SETELAH PAJAK" in val or "LABA BERSIH" in val:
                laba_row_idx = i
                break

        if laba_row_idx == -1:
            for i in range(month_row_idx + 2, len(df_raw)):
                val = str(df_raw.iloc[i, 0]).upper()
                if "LABA (RUGI)" in val or "LABA KOTOR" in val or "LABA" in val:
                    laba_row_idx = i
                    break

        if laba_row_idx == -1:
            raise ValueError("Tidak dapat menemukan baris Laba")

        laba_row = df_raw.iloc[laba_row_idx].values

        data_points = []
        for col_idx in range(1, len(month_row)):
            cell_val = str(month_row[col_idx]).strip().upper()

            # Match month
            matched_month = None
            for key, full_month in self._MONTHS_MAP.items():
                if key in cell_val:
                    matched_month = full_month
                    break

            if matched_month:
                rkap_ytd = None
                real_ytd = None

                for c in range(col_idx, min(col_idx + 5, len(subheader_row))):
                    sub = str(subheader_row[c]).upper()
                    if "YTD RKAP" in sub or ("RKAP" in sub and "YTD" in sub):
                        val = laba_row[c]
                        rkap_ytd = normalize_indonesian_number(val)
                    elif "YTD REAL" in sub or ("REAL" in sub and "YTD" in sub):
                        val = laba_row[c]
                        real_ytd = normalize_indonesian_number(val)

                data_points.append(
                    {
                        "periode": matched_month,
                        "rencana": rkap_ytd,
                        "realisasi": real_ytd,
                    }
                )

        unique_points = []
        seen = set()
        for dp in data_points:
            if dp["periode"] not in seen:
                unique_points.append(dp)
                seen.add(dp["periode"])

        if not unique_points:
            raise ValueError("Tidak ada data bulan yang valid")

        return unique_points
