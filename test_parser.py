import sys
import os
import io
import json
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.parsers.portofolio_parser import PortofolioParser

file_path = "docs/5.20260512_Rekap Bangus-Portofolio DAHANA_Mei 2026.R1.xlsx"
with open(file_path, "rb") as f:
    b = f.read()

parser = PortofolioParser(file_bytes=io.BytesIO(b), context="dic")
try:
    res = parser.parse()
    print(json.dumps(res["data"]["neraca"], indent=2))
except Exception as e:
    import traceback
    traceback.print_exc()
