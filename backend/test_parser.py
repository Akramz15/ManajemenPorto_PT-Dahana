import sys
import pandas as pd
sys.path.append("/Users/akram/UNY/Magang/PT Dahana/Project_ManajemenPorto_PengembanganUsaha/backend")

from app.parsers.portofolio_parser import PortofolioParser

class DummyContext:
    def __init__(self):
        self.context = "dic"
        # Just create an empty dataframe that simulates the expected sheets
        self.file_bytes = b""
        self.source_file = "dummy.xlsx"
        self.uploaded_by = "test"
    
    def _open(self):
        # Return an ExcelFile-like object
        # We can just write a dummy excel and read it back
        df = pd.DataFrame([[""]*30]*30)
        with pd.ExcelWriter("dummy.xlsx") as writer:
            df.to_excel(writer, sheet_name="RKAP-REAL DIC", index=False, header=False)
            df.to_excel(writer, sheet_name="Neraca&CF DIC", index=False, header=False)
            df.to_excel(writer, sheet_name="Lap. DIC-R1", index=False, header=False)
        return pd.ExcelFile("dummy.xlsx")

class DummyParser(PortofolioParser):
    def __init__(self):
        self.context = "dic"
        self.file_bytes = b""
        self.source_file = "dummy.xlsx"
        self.uploaded_by = "test"
    def _open(self):
        df = pd.DataFrame([[""]*30]*30)
        with pd.ExcelWriter("dummy.xlsx") as writer:
            df.to_excel(writer, sheet_name="RKAP-REAL DIC", index=False, header=False)
            df.to_excel(writer, sheet_name="Neraca&CF DIC", index=False, header=False)
            df.to_excel(writer, sheet_name="Lap. DIC-R1", index=False, header=False)
        return pd.ExcelFile("dummy.xlsx")

parser = DummyParser()
res = parser.parse()
print(res.keys())
print("rkap_pendapatan length:", len(res["data"]["rkap_pendapatan"]))
