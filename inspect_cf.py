import pandas as pd

file_path = "docs/5.20260512_Rekap Bangus-Portofolio DAHANA_Mei 2026.R1.xlsx"
xl = pd.ExcelFile(file_path)

df = pd.read_excel(xl, sheet_name="Neraca&CF DIC", header=None)

print("Cash Flow DIC rows:")
for i, row in df.iterrows():
    vals = [str(x) for x in row.values if pd.notna(x) and str(x).strip() != ""]
    if vals:
        print(f"Row {i}: {vals[:10]}") # print first 10 non-empty values
