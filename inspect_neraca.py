import pandas as pd
xl = pd.ExcelFile("docs/5.20260512_Rekap Bangus-Portofolio DAHANA_Mei 2026.R1.xlsx")
try:
    df = pd.read_excel(xl, sheet_name="Neraca&CF DIC", header=None)
    print("Neraca&CF DIC:")
    for idx, row in df.head(30).iterrows():
        print([str(x)[:20] for x in row.values])
except Exception as e:
    print(e)
