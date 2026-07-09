import pandas as pd
xl = pd.ExcelFile("docs/5.20260512_Rekap Bangus-Portofolio DAHANA_Mei 2026.R1.xlsx")
df = pd.read_excel(xl, sheet_name="Neraca&CF DIC", header=None)
for i in range(2, 10):
    print(f"Row {i}: {list(df.iloc[i].values)}")
