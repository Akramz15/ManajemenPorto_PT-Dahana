import pandas as pd
xl = pd.ExcelFile("docs/5.20260512_Rekap Bangus-Portofolio DAHANA_Mei 2026.R1.xlsx")
df = pd.read_excel(xl, sheet_name="Lap. KAN-R1", header=None)

for i in range(150):
    try:
        row_vals = [str(x) for x in df.iloc[i].values if pd.notna(x)]
        if len(row_vals) > 0:
            row_str = " | ".join(row_vals)
            if "ekuitas" in row_str.lower() or "saham" in row_str.lower() or "modal" in row_str.lower() or "laba" in row_str.lower():
                print(f"Row {i}: {row_str}")
    except:
        pass
