import pandas as pd
from app.parsers.base_parser import BaseExcelParser
from app.parsers.normalizer import normalize_indonesian_number

class LabaRugiParser(BaseExcelParser):
    _SHEET_KW = ["laba rugi", "laba", "rugi", "p&l", "profit loss", "rkap", "realisasi", "l/r", "sheet1"]
    
    _MONTHS_MAP = {
        "JAN": "JANUARI", "FEB": "FEBRUARI", "MAR": "MARET", "APR": "APRIL",
        "MEI": "MEI", "JUN": "JUNI", "JUL": "JULI", "AGU": "AGUSTUS",
        "SEP": "SEPTEMBER", "OKT": "OKTOBER", "NOV": "NOVEMBER", "DES": "DESEMBER"
    }

    def parse(self) -> dict:
        sheet = self._find_sheet(self._SHEET_KW)
        df = self._read_sheet(sheet)
        
        # We need to read without headers to parse horizontal layout
        df_raw = pd.read_excel(self.file_bytes, sheet_name=sheet, header=None)

        # 1. Find the row containing months
        month_row_idx = -1
        for i in range(min(10, len(df_raw))):
            row_vals = [str(x).upper() for x in df_raw.iloc[i].values]
            if any("JANUARI" in val or "JAN" in val for val in row_vals if pd.notna(x)):
                month_row_idx = i
                break

        if month_row_idx == -1:
            raise ValueError("Tidak dapat menemukan baris bulan (Januari, dsb.) di Excel Laba/Rugi")

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
            raise ValueError("Tidak dapat menemukan baris 'Laba Setelah Pajak' atau 'Laba' pada kolom pertama")

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
                
                # Check subheaders in the current and next few columns
                for c in range(col_idx, min(col_idx + 5, len(subheader_row))):
                    sub = str(subheader_row[c]).upper()
                    # Kita butuh nilai YTD (Year To Date)
                    if "YTD RKAP" in sub or ("RKAP" in sub and "YTD" in sub):
                        val = laba_row[c]
                        rkap_ytd = normalize_indonesian_number(val)
                    elif "YTD REAL" in sub or ("REAL" in sub and "YTD" in sub):
                        val = laba_row[c]
                        real_ytd = normalize_indonesian_number(val)

                data_points.append({
                    "periode": matched_month,
                    "rencana": round(rkap_ytd, 2) if rkap_ytd is not None else None,
                    "realisasi": round(real_ytd, 2) if real_ytd is not None else None,
                })

        # Remove duplicates from data_points (if multiple columns match the same month, take the first valid)
        unique_points = []
        seen = set()
        for dp in data_points:
            if dp["periode"] not in seen:
                unique_points.append(dp)
                seen.add(dp["periode"])

        if not unique_points:
            raise ValueError("Tidak ada data bulan yang valid ditemukan di Excel")

        return {
            "chart_type": "laba-rugi",
            "data_points": unique_points,
            "sheet_used": sheet,
        }
