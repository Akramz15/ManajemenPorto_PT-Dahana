# Modul 08 — Sistem Visualisasi & Charting

## 1. Prinsip Visualisasi

| Prinsip | Implementasi |
|---------|-------------|
| Zero-table | Seluruh data sebagai grafik, tidak ada `<table>` |
| Tooltip wajib | Setiap grafik punya `CustomTooltip` dengan data lengkap |
| Responsive | `ResponsiveContainer` dari Recharts di semua chart |
| Color semantics | Biru = netral/plan, Hijau = positif, Merah = negatif |
| Lazy rendering | Data fetch saat komponen pertama kali dimount |

---

## 2. Chart Registry & Types

```typescript
// src/types/chart.types.ts
export interface KurvaSPoint {
  periode: string;
  rencana: number | null;
  realisasi: number | null;
}

export interface FinancialPoint {
  periode: string;
  penjualan: number;
  hpp: number;
  laba_kotor?: number;
  laba_bersih?: number;
}

export interface CashFlowPoint {
  periode: string;
  penerimaan: number;
  pengeluaran: number;
}

export interface RKAPPoint {
  periode: string;
  rkap: number;
  realisasi: number;
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface InventoriPoint {
  periode: string;
  stok_awal: number;
  produksi: number;
  pengeluaran: number;
  stok_akhir: number;
}

export interface BubblePoint {
  id: string;
  nama: string;
  roi_persen: number;
  risiko_score: number;
  nilai_investasi: number;
  status: "aktif" | "prospek" | "ditangguhkan";
}
```

---

## 3. Custom Tooltip Base

```typescript
// src/components/charts/TooltipBase.tsx
interface TooltipBaseProps {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}

export function TooltipBase({ title, rows }: TooltipBaseProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card-hover p-3 text-xs min-w-36">
      <p className="font-semibold text-slate-900 mb-2 pb-1.5 border-b border-slate-100">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <span className="text-slate-500">{row.label}</span>
            <span className={`font-semibold ${row.color ?? "text-slate-800"}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Formatter Utilities

```typescript
// src/lib/formatters.ts
export const formatRupiah = (value: number | null | undefined, abbreviated = false): string => {
  if (value === null || value === undefined) return "N/A";
  if (abbreviated) {
    if (Math.abs(value) >= 1e12) return `Rp ${(value / 1e12).toFixed(1)}T`;
    if (Math.abs(value) >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}M`;
    if (Math.abs(value) >= 1e6) return `Rp ${(value / 1e6).toFixed(1)}Jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPersen = (value: number | null | undefined, decimals = 1): string => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
};

export const formatTon = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toLocaleString("id-ID")} Ton`;
};

export const formatRibu = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return value.toLocaleString("id-ID");
};
```

---

## 5. useChartData Hook

```typescript
// src/hooks/useChartData.ts
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

interface UseChartDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChartData<T>(context: string, subContext?: string): UseChartDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = subContext ? { sub_context: subContext } : {};
      const res = await apiClient.get(`/api/v1/charts/${context}`, { params });
      setData(res.data?.data_json ?? null);
    } catch {
      setError("Gagal memuat data grafik. Silakan upload file Excel terlebih dahulu.");
    } finally {
      setLoading(false);
    }
  }, [context, subContext]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
```

---

## 6. Chart Loading & Error States

```typescript
// src/components/charts/ChartShell.tsx
import { Loader2, AlertCircle, UploadCloud } from "lucide-react";

interface ChartShellProps {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  onUploadClick?: () => void;
  children: React.ReactNode;
  height?: number;
}

export function ChartShell({ loading, error, hasData, onUploadClick, children, height = 360 }: ChartShellProps) {
  if (loading) {
    return (
      <div className="card flex items-center justify-center" style={{ height }}>
        <Loader2 size={24} className="text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error || !hasData) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 text-slate-400" style={{ height }}>
        {error ? (
          <>
            <AlertCircle size={28} className="text-negative-400" />
            <p className="text-sm text-center text-slate-500 max-w-xs">{error}</p>
          </>
        ) : (
          <>
            <UploadCloud size={32} className="opacity-40" />
            <p className="text-sm text-slate-500">Belum ada data. Upload file Excel untuk mulai.</p>
            {onUploadClick && (
              <button onClick={onUploadClick} className="btn-primary">
                Upload Excel
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 7. Responsive Layout Grid

```typescript
// src/components/layout/DashboardGrid.tsx
interface DashboardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
}

export function DashboardGrid({ children, cols = 2 }: DashboardGridProps) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  }[cols];

  return (
    <div className={`grid gap-5 ${colClass}`}>
      {children}
    </div>
  );
}
```

---

## 8. Chart Color Palette Constants

```typescript
// src/components/charts/colors.ts
export const CHART_COLORS = {
  primary: "#3B82F6",
  primaryLight: "#93C5FD",
  positive: "#10B981",
  positiveLight: "#6EE7B7",
  negative: "#F43F5E",
  negativeLight: "#FDA4AF",
  neutral: "#94A3B8",
  neutralLight: "#CBD5E1",
  purple: "#8B5CF6",
  amber: "#F59E0B",
} as const;

export const DONUT_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.positive,
  CHART_COLORS.negative,
  CHART_COLORS.purple,
  CHART_COLORS.amber,
  CHART_COLORS.neutral,
];
```

---

## 📌 Prompt AI — Modul 08

```
Bangun sistem visualisasi lengkap untuk Dahana BizPort.

Tugas:
1. Buat src/types/chart.types.ts dengan semua TypeScript interface untuk data charts
2. Buat src/components/charts/TooltipBase.tsx — reusable tooltip wrapper
3. Buat src/lib/formatters.ts dengan fungsi:
   - formatRupiah(value, abbreviated?) → "Rp 5,0M" atau "Rp 5.000.000"
   - formatPersen(value, decimals?) → "45.2%"
   - formatTon(value) → "1.234 Ton"
4. Buat src/hooks/useChartData.ts — fetch chart data dari FastAPI
5. Buat src/components/charts/ChartShell.tsx — wrapper dengan 3 state:
   loading (spinner), empty (upload prompt), dan data (render children)
6. Buat src/components/layout/DashboardGrid.tsx — responsive grid 1/2/3 kolom
7. Buat src/components/charts/colors.ts — konstanta warna chart

Pastikan semua tooltip menampilkan:
- Nilai pasti (bukan hanya grafik visual)
- Format Indonesia (Rupiah, persentase, ton)
- Warna konsisten dengan token warna sistem

Kode clean, no redundant comments.
```
