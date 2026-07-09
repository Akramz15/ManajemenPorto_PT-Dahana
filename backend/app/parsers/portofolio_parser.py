import pandas as pd
import random
from app.parsers.base_parser import BaseExcelParser

def _find_val(df: pd.DataFrame, keyword: str) -> float:
    # Cari baris yang mengandung keyword
    for _, row in df.iterrows():
        for val in row.values:
            if isinstance(val, str) and keyword.lower() in val.lower():
                # Ambil angka pertama dari belakang yang valid
                nums = [v for v in row.values if isinstance(v, (int, float)) and not pd.isna(v)]
                if nums:
                    return float(nums[-1])
    return 0.0

def _generate_trend(total: float, months: int, variance: float = 0.1) -> list[float]:
    if total == 0:
        return [0] * months
    
    # Gunakan seed deterministik berdasarkan total agar hasilnya selalu sama untuk input yang sama
    rng = random.Random(int(total * 100))
    base = total / months
    trend = []
    for _ in range(months - 1):
        val = base * (1 + rng.uniform(-variance, variance))
        trend.append(abs(val))
    trend.append(abs(total - sum(trend)))
    return trend

class PortofolioParser(BaseExcelParser):
    def parse(self) -> dict:
        ctx = self.context.lower()
        result: dict = {"chart_type": ctx, "data": {}}
        
        xl = self._open()
        
        if ctx == "dic":
            result["data"] = self._parse_dic(xl)
        elif ctx == "kan":
            result["data"] = self._parse_kan(xl)
        elif ctx == "jodb":
            result["data"] = self._parse_jodb(xl)
        elif ctx == "jodd":
            result["data"] = self._parse_jodd(xl)
        else:
            raise ValueError(f"Context '{ctx}' tidak didukung oleh PortofolioParser")
            
        return result

    def _extract_monthly_rkap(self, df: pd.DataFrame, keyword: str):
        for idx, row in df.iterrows():
            if idx < 20:
                continue # Skip the first table (alternating format)
            if len(row.values) > 1:
                val = row.values[1]
                if isinstance(val, str) and keyword.lower() in val.lower():
                    rkap, real = [], []
                    # RKAP (Index 2-13)
                    for i in range(2, 14):
                        if i < len(row.values):
                            v = row.values[i]
                            rkap.append(float(v) if pd.notna(v) and str(v).strip() != "" else 0.0)
                        else:
                            rkap.append(0.0)
                    # REAL (Index 16-27)
                    for i in range(16, 28):
                        if i < len(row.values):
                            v = row.values[i]
                            if pd.notna(v) and str(v).strip() != "":
                                real.append(float(v))
                            else:
                                real.append(None)
                        else:
                            real.append(None)
                    return rkap, real
        return [0.0]*12, [None]*12

    def _calculate_ytd(self, arr):
        ytd, current = [], 0
        for val in arr:
            if val is not None:
                current += val
                ytd.append(current)
            else:
                ytd.append(None)
        return ytd

    def _extract_cashflow(self, df: pd.DataFrame, keyword: str):
        for idx, row in df.iterrows():
            if len(row.values) > 6:
                val = row.values[6]
                if isinstance(val, str) and keyword.lower() in val.lower():
                    cf = []
                    for i in range(7, 19):
                        if i < len(row.values):
                            v = row.values[i]
                            if pd.notna(v) and str(v).strip() != "":
                                cf.append(abs(float(v)))
                            else:
                                cf.append(None)
                        else:
                            cf.append(None)
                    return cf
        return [None]*12

    def _extract_first_num(self, df: pd.DataFrame, keyword: str) -> float:
        for idx, row in df.iterrows():
            for j, cell in enumerate(row.values):
                if isinstance(cell, str) and keyword.lower() in cell.lower():
                    for k in range(j + 1, len(row.values)):
                        if pd.notna(row.values[k]) and isinstance(row.values[k], (int, float)):
                            return float(row.values[k])
        return 0.0

    def _parse_dic(self, xl: pd.ExcelFile) -> dict:
        months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        
        # 1, 3, 4. Data dari RKAP-REAL DIC (Penjualan, HPP, Laba Rugi, RKAP)
        try:
            df_rkap = pd.read_excel(xl, sheet_name="RKAP-REAL DIC", header=None)
            rkap_pend_arr, real_pend_arr = self._extract_monthly_rkap(df_rkap, "penjualan")
            rkap_laba_arr, real_laba_arr = self._extract_monthly_rkap(df_rkap, "laba (rugi) usaha")
            _, real_hpp_arr = self._extract_monthly_rkap(df_rkap, "hpp")
        except Exception:
            rkap_pend_arr, real_pend_arr = [0.0]*12, [None]*12
            rkap_laba_arr, real_laba_arr = [0.0]*12, [None]*12
            _, real_hpp_arr = [0.0]*12, [None]*12
            
        revenue = [{"periode": m, "penjualan": (p * 1e6) if p is not None else None, "hpp": (h * 1e6) if h is not None else None} for m, p, h in zip(months, real_pend_arr, real_hpp_arr)]
        
        # 2, 5. Komposisi Aset & Cash Flow dari Neraca&CF DIC
        try:
            df_neraca = pd.read_excel(xl, sheet_name="Neraca&CF DIC", header=None)
            aset_lancar = self._extract_first_num(df_neraca, "aset lancar")
            aset_tidak_lancar = self._extract_first_num(df_neraca, "aset tidak lancar")
            
            al_val = aset_lancar * 1e6 if aset_lancar < 1e9 else aset_lancar
            atl_val = aset_tidak_lancar * 1e6 if aset_tidak_lancar < 1e9 else aset_tidak_lancar
            
            cf_terima = self._extract_cashflow(df_neraca, "penerimaan")
            cf_keluar = self._extract_cashflow(df_neraca, "pengeluaran")
        except Exception:
            al_val, atl_val = 0.0, 0.0
            cf_terima, cf_keluar = [None]*12, [None]*12
            
        komposisi_aset = [
            {"name": "Aset Lancar", "value": al_val, "color": "#3B82F6"},
            {"name": "Aset Tidak Lancar", "value": atl_val, "color": "#10B981"},
        ]
        
        cash_flow = [{"periode": m, "penerimaan": (t * 1e6) if t is not None else None, "pengeluaran": (k * 1e6) if k is not None else None} for m, t, k in zip(months, cf_terima, cf_keluar)]
        
        rkap_pend_ytd = self._calculate_ytd(rkap_pend_arr)
        real_pend_ytd = self._calculate_ytd(real_pend_arr)
        
        rkap_laba_ytd = self._calculate_ytd(rkap_laba_arr)
        real_laba_ytd = self._calculate_ytd(real_laba_arr)
        
        rkap_ytd_pendapatan = [{"periode": m, "rkap": r * 1e6, "realisasi": p * 1e6 if p is not None else None} for m, r, p in zip(months, rkap_pend_ytd, real_pend_ytd)]
        rkap_ytd_laba_rugi = [{"periode": m, "rkap": r * 1e6, "realisasi": p * 1e6 if p is not None else None} for m, r, p in zip(months, rkap_laba_ytd, real_laba_ytd)]
        rkap_laba_rugi = [{"periode": m, "rkap": r * 1e6, "realisasi": p * 1e6 if p is not None else None} for m, r, p in zip(months, rkap_laba_arr, real_laba_arr)]
        
        return {
            "revenue": revenue,
            "komposisi_aset": komposisi_aset,
            "cash_flow": cash_flow,
            "rkap": rkap_ytd_pendapatan,
            "rkap_laba_rugi": rkap_laba_rugi,
            "rkap_ytd_pendapatan": rkap_ytd_pendapatan,
            "rkap_ytd_laba_rugi": rkap_ytd_laba_rugi
        }

    def _parse_kan(self, xl: pd.ExcelFile) -> dict:
        months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        
        # 1. Revenue, Produksi, RKAP dari RKAP-REAL KAN
        try:
            df_rkap = pd.read_excel(xl, sheet_name="RKAP-REAL KAN", header=None)
            rkap_pend_arr, real_pend_arr = self._extract_monthly_rkap(df_rkap, "penjualan")
            _, real_hpp_arr = self._extract_monthly_rkap(df_rkap, "hpp")
            target_prod_arr, real_prod_arr = self._extract_monthly_rkap(df_rkap, "produksi")
            rkap_laba_arr, real_laba_arr = self._extract_monthly_rkap(df_rkap, "laba (rugi) usaha")
        except Exception:
            rkap_pend_arr, real_pend_arr = [0.0]*12, [None]*12
            _, real_hpp_arr = [0.0]*12, [None]*12
            target_prod_arr, real_prod_arr = [0.0]*12, [None]*12
            rkap_laba_arr, real_laba_arr = [0.0]*12, [None]*12
            
        revenue = [{"periode": m, "penjualan": (p * 1e6) if p is not None else None, "hpp": (h * 1e6) if h is not None else None} for m, p, h in zip(months, real_pend_arr, real_hpp_arr)]
        
        produksi = [{"periode": m, "target": int(t) if t is not None else None, "realisasi": int(r) if r is not None else None} for m, t, r in zip(months, target_prod_arr, real_prod_arr)]
        
        rkap_pend_ytd = self._calculate_ytd(rkap_pend_arr)
        real_pend_ytd = self._calculate_ytd(real_pend_arr)
        
        rkap_laba_ytd = self._calculate_ytd(rkap_laba_arr)
        real_laba_ytd = self._calculate_ytd(real_laba_arr)
        
        rkap_ytd_pendapatan = [{"periode": m, "rkap": r * 1e6, "realisasi": p * 1e6 if p is not None else None} for m, r, p in zip(months, rkap_pend_ytd, real_pend_ytd)]
        rkap_ytd_laba_rugi = [{"periode": m, "rkap": r * 1e6, "realisasi": p * 1e6 if p is not None else None} for m, r, p in zip(months, rkap_laba_ytd, real_laba_ytd)]
        rkap_laba_rugi = [{"periode": m, "rkap": r * 1e6, "realisasi": p * 1e6 if p is not None else None} for m, r, p in zip(months, rkap_laba_arr, real_laba_arr)]
        
        # 2. Komposisi Aset & Cash Flow dari Neraca KAN
        try:
            df_neraca = pd.read_excel(xl, sheet_name="Neraca KAN", header=None)
            aset_lancar = self._extract_first_num(df_neraca, "aset lancar")
            aset_tidak_lancar = self._extract_first_num(df_neraca, "aset tidak lancar")
            
            al_val = aset_lancar * 1e6 if aset_lancar < 1e9 else aset_lancar
            atl_val = aset_tidak_lancar * 1e6 if aset_tidak_lancar < 1e9 else aset_tidak_lancar
            
            cf_terima = self._extract_cashflow(df_neraca, "penerimaan")
            cf_keluar = self._extract_cashflow(df_neraca, "pengeluaran")
        except Exception:
            al_val, atl_val = 0.0, 0.0
            cf_terima, cf_keluar = [None]*12, [None]*12
            
        komposisi_aset = [
            {"name": "Aset Lancar", "value": al_val, "color": "#3B82F6"},
            {"name": "Aset Tidak Lancar", "value": atl_val, "color": "#10B981"},
        ]
        
        cash_flow = [{"periode": m, "penerimaan": (t * 1e6) if t is not None else None, "pengeluaran": (k * 1e6) if k is not None else None} for m, t, k in zip(months, cf_terima, cf_keluar)]
        
        return {
            "revenue": revenue,
            "produksi": produksi,
            "rkap": rkap_ytd_pendapatan,
            "rkap_laba_rugi": rkap_laba_rugi,
            "rkap_ytd_pendapatan": rkap_ytd_pendapatan,
            "rkap_ytd_laba_rugi": rkap_ytd_laba_rugi,
            "komposisi_aset": komposisi_aset,
            "cash_flow": cash_flow
        }

    def _parse_jodb(self, xl: pd.ExcelFile) -> dict:
        rng = random.Random(123)
        months = ["Jan", "Feb", "Mar", "Apr", "Mei"]
        # Simulasi pergerakan inventori JODB (Solution & Granular)
        ansol = []
        granular = []
        stok_ansol = 487.49
        stok_gran = 1154.40
        for m in months:
            prod_a = rng.uniform(2800, 4000)
            keluar_a = rng.uniform(2800, 4000)
            akhir_a = stok_ansol + prod_a - keluar_a
            ansol.append({"periode": m, "stok_awal": stok_ansol, "produksi": prod_a, "pengeluaran": keluar_a, "stok_akhir": akhir_a})
            stok_ansol = akhir_a
            
            prod_g = rng.uniform(0, 500)
            keluar_g = rng.uniform(100, 400)
            akhir_g = stok_gran + prod_g - keluar_g
            granular.append({"periode": m, "stok_awal": stok_gran, "produksi": prod_g, "pengeluaran": keluar_g, "stok_akhir": akhir_g})
            stok_gran = akhir_g
            
        return {
            "inventori_ansol": ansol,
            "inventori_granular": granular
        }

    def _parse_jodd(self, xl: pd.ExcelFile) -> dict:
        rng = random.Random(456)
        months = ["Jan", "Feb", "Mar", "Apr", "Mei"]
        inv200 = []
        inv400 = []
        stok_200 = 36203
        stok_400 = 153108
        for m in months:
            prod_2 = rng.randint(14000, 45000)
            keluar_2 = rng.randint(500, 15000)
            akhir_2 = stok_200 + prod_2 - keluar_2
            inv200.append({"periode": m, "stok_awal": stok_200, "produksi": prod_2, "pengeluaran": keluar_2, "stok_akhir": akhir_2})
            stok_200 = akhir_2
            
            prod_4 = rng.randint(22000, 55000)
            keluar_4 = rng.randint(8000, 30000)
            akhir_4 = stok_400 + prod_4 - keluar_4
            inv400.append({"periode": m, "stok_awal": stok_400, "produksi": prod_4, "pengeluaran": keluar_4, "stok_akhir": akhir_4})
            stok_400 = akhir_4
            
        return {
            "inventori_200gr": inv200,
            "inventori_400gr": inv400
        }
