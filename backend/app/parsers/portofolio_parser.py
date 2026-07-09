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

    def _extract_cf_by_section(self, df: pd.DataFrame, section_keyword: str):
        terima = [None]*12
        keluar = [None]*12
        found_section = False
        
        for idx, row in df.iterrows():
            if len(row.values) > 6:
                val = row.values[6]
                if isinstance(val, str):
                    val_lower = val.lower()
                    if not found_section:
                        if section_keyword.lower() in val_lower:
                            found_section = True
                    else:
                        if "penerimaan" in val_lower:
                            terima = []
                            for i in range(7, 19):
                                if i < len(row.values) and pd.notna(row.values[i]) and str(row.values[i]).strip() != "":
                                    terima.append(abs(float(row.values[i])))
                                else:
                                    terima.append(None)
                        elif "pengeluaran" in val_lower:
                            keluar = []
                            for i in range(7, 19):
                                if i < len(row.values) and pd.notna(row.values[i]) and str(row.values[i]).strip() != "":
                                    keluar.append(abs(float(row.values[i])))
                                else:
                                    keluar.append(None)
                            break
        return terima, keluar

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
            
            cfo_terima, cfo_keluar = self._extract_cf_by_section(df_neraca, "aktivitas operasi")
            cfi_terima, cfi_keluar = self._extract_cf_by_section(df_neraca, "investasi")
            cff_terima, cff_keluar = self._extract_cf_by_section(df_neraca, "funding")
        except Exception:
            al_val, atl_val = 0.0, 0.0
            cfo_terima, cfo_keluar = [None]*12, [None]*12
            cfi_terima, cfi_keluar = [None]*12, [None]*12
            cff_terima, cff_keluar = [None]*12, [None]*12
            
        komposisi_aset = [
            {"name": "Aset Lancar", "value": al_val, "color": "#3B82F6"},
            {"name": "Aset Tidak Lancar", "value": atl_val, "color": "#10B981"},
        ]
        
        cash_flow = [
            {
                "periode": m,
                "cfo_terima": (ot * 1e6) if ot is not None else None,
                "cfo_keluar": (ok * 1e6) if ok is not None else None,
                "cfi_terima": (it * 1e6) if it is not None else None,
                "cfi_keluar": (ik * 1e6) if ik is not None else None,
                "cff_terima": (ft * 1e6) if ft is not None else None,
                "cff_keluar": (fk * 1e6) if fk is not None else None
            }
            for m, ot, ok, it, ik, ft, fk in zip(months, cfo_terima, cfo_keluar, cfi_terima, cfi_keluar, cff_terima, cff_keluar)
        ]
        
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
        
        # 2. Komposisi Aset & Cash Flow
        try:
            df_neraca = pd.read_excel(xl, sheet_name="Neraca KAN", header=None)
            cfo_terima, cfo_keluar = self._extract_cf_by_section(df_neraca, "aktivitas operasi")
            cfi_terima, cfi_keluar = self._extract_cf_by_section(df_neraca, "investasi")
            cff_terima, cff_keluar = self._extract_cf_by_section(df_neraca, "funding")
        except Exception:
            cfo_terima, cfo_keluar = [None]*12, [None]*12
            cfi_terima, cfi_keluar = [None]*12, [None]*12
            cff_terima, cff_keluar = [None]*12, [None]*12

        try:
            df_kan_r1 = pd.read_excel(xl, sheet_name="Lap. KAN-R1", header=None)
            aset_tidak_lancar = self._extract_first_num(df_kan_r1, "jumlah aset tidak lancar")
            ekuitas = self._extract_first_num(df_kan_r1, "jumlah ekuitas")
            
            # The values in Lap. KAN-R1 are in thousands or millions? 
            # 1209712 * 1e6 = 1.2 Trillion. Yes, usually in Jutaan (Millions).
            atl_val = aset_tidak_lancar * 1e6
            eq_val = ekuitas * 1e6
        except Exception:
            atl_val, eq_val = 0.0, 0.0
            
        komposisi_aset = [
            {"name": "Aset Tidak Lancar", "value": atl_val, "color": "#10B981"},
            {"name": "Ekuitas", "value": eq_val, "color": "#F59E0B"},
        ]
        
        cash_flow = [
            {
                "periode": m,
                "cfo_terima": (ot * 1e6) if ot is not None else None,
                "cfo_keluar": (ok * 1e6) if ok is not None else None,
                "cfi_terima": (it * 1e6) if it is not None else None,
                "cfi_keluar": (ik * 1e6) if ik is not None else None,
                "cff_terima": (ft * 1e6) if ft is not None else None,
                "cff_keluar": (fk * 1e6) if fk is not None else None
            }
            for m, ot, ok, it, ik, ft, fk in zip(months, cfo_terima, cfo_keluar, cfi_terima, cfi_keluar, cff_terima, cff_keluar)
        ]
        
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
        
    def _extract_jod_inventory(self, df: pd.DataFrame, keyword: str) -> list:
        inventory = []
        months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        month_idx = 0
        for idx, row in df.iterrows():
            if len(row.values) > 6:
                jenis = str(row.values[2])
                if keyword.lower() in jenis.lower():
                    awal = row.values[3]
                    prod = row.values[4]
                    keluar = row.values[5]
                    akhir = row.values[6]
                    def safe_float(v):
                        if pd.notna(v) and str(v).strip() != "":
                            try:
                                return float(v)
                            except ValueError:
                                return None
                        return None
                        
                    awal_val = safe_float(awal)
                    prod_val = safe_float(prod)
                    keluar_val = safe_float(keluar)
                    akhir_val = safe_float(akhir)
                    
                    # If all inputs are empty but akhir is 0 (due to excel formula), treat as None
                    if awal_val is None and prod_val is None and keluar_val is None and akhir_val == 0.0:
                        akhir_val = None
                    elif akhir_val is not None:
                        # If the month is valid, empty production or pengeluaran means 0
                        if prod_val is None: prod_val = 0.0
                        if keluar_val is None: keluar_val = 0.0
                        
                    inventory.append({
                        "periode": months[month_idx] if month_idx < 12 else "Unknown",
                        "stok_awal": awal_val,
                        "produksi": prod_val,
                        "pengeluaran": keluar_val,
                        "stok_akhir": akhir_val
                    })
                    month_idx += 1
                    if month_idx >= 12:
                        break
        
        while len(inventory) < 12:
            inventory.append({
                "periode": months[len(inventory)],
                "stok_awal": None,
                "produksi": None,
                "pengeluaran": None,
                "stok_akhir": None
            })
            
        return inventory

    def _parse_jodb(self, xl: pd.ExcelFile) -> dict:
        try:
            df_jodb = pd.read_excel(xl, sheet_name="JODB", header=None)
            ansol = self._extract_jod_inventory(df_jodb, "solution")
            granular = self._extract_jod_inventory(df_jodb, "granul")
        except Exception:
            ansol = []
            granular = []
            
        return {
            "inventori_ansol": ansol,
            "inventori_granular": granular
        }

    def _parse_jodd(self, xl: pd.ExcelFile) -> dict:
        try:
            df_jodd = pd.read_excel(xl, sheet_name="JODD", header=None)
            inv200 = self._extract_jod_inventory(df_jodd, "200 gr")
            inv400 = self._extract_jod_inventory(df_jodd, "400 gr")
        except Exception:
            inv200 = []
            inv400 = []
            
        return {
            "inventori_200gr": inv200,
            "inventori_400gr": inv400
        }
