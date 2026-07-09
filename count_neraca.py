import pandas as pd
xl = pd.ExcelFile("docs/5.20260512_Rekap Bangus-Portofolio DAHANA_Mei 2026.R1.xlsx")
df = pd.read_excel(xl, sheet_name="Neraca&CF DIC", header=None)
asets = []
for idx, row in df.iterrows():
    if isinstance(row.values[1], str) and "total aset" in row.values[1].lower():
        asets.append(row.values[3])
print("DIC Asets:", len(asets), asets)

df_kan = pd.read_excel(xl, sheet_name="Neraca KAN", header=None)
asets_kan = []
for idx, row in df_kan.iterrows():
    if isinstance(row.values[1], str) and "total aset" in row.values[1].lower():
        asets_kan.append(row.values[3])
print("KAN Asets:", len(asets_kan), asets_kan)
