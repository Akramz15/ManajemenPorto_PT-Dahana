import json
from app.parsers.portofolio_parser import PortofolioParser
import pandas as pd

class MockParser(PortofolioParser):
    def __init__(self):
        self.context = "dic"
    def _open(self):
        return pd.ExcelFile("docs/5.20260512_Rekap Bangus-Portofolio DAHANA_Mei 2026.R1.xlsx")

parser = MockParser()
res = parser.parse()
print(json.dumps(res["data"]["rkap_ytd_pendapatan"][:2], indent=2))
print("...")
print(json.dumps(res["data"]["rkap_ytd_pendapatan"][-2:], indent=2))
