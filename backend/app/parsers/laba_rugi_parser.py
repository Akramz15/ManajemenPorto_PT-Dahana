from app.parsers.kurva_s_parser import KurvaSParser

class LabaRugiParser(KurvaSParser):
    _SHEET_KW = ["laba rugi", "laba-rugi", "laba", "rugi", "p&l", "profit loss", "rkap", "realisasi", "l/r", "sheet1"]
    _RENCANA_KW = ["rkap", "rencana", "plan", "target", "anggaran"]
    _REALISASI_KW = ["realisasi", "actual", "aktual"]
    _PERIODE_KW = ["periode", "bulan", "month", "minggu", "week"]

    def parse(self) -> dict:
        # Panggil fungsi parse bawaan KurvaSParser (karena struktur data sama: periode, rencana/rkap, realisasi)
        result = super().parse()
        # Ubah nama chart_type agar sesuai dengan kebutuhan laba-rugi
        result["chart_type"] = "laba-rugi"
        return result
