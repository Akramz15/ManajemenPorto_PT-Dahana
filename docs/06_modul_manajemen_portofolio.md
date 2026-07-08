# Modul 06 — Modul Manajemen Portofolio

## 1. Overview

Modul Portofolio memvisualisasikan kinerja finansial dan operasional PT Dahana
melalui grafik murni. Data berasal dari satu file Excel rekap bulanan per entitas.

```
Manajemen Portofolio
├── Anak Cucu
│   ├── DIC  → Finansial lengkap (P&L, Neraca, Cash Flow, RKAP)
│   └── KAN  → Produksi AN + Finansial ringkas
├── JO (Joint Operation)
│   ├── JODD → Inventori Dayaprime + Finansial placeholder
│   └── JODB → Inventori ANSOL & Granular
└── Lainnya → Bubble/Kanban investasi & afiliasi
```

---

## 2. DIC Dashboard — Layout

```
Row 1: [Area Chart Penjualan & HPP]  [Donut Chart Rasio HPP/Sales]
Row 2: [Area Chart Laba Kotor]       [Donut Chart Komposisi Aset]
Row 3: [Bar Chart Arus Kas]          [Line Chart RKAP vs Realisasi]
```

---

## 3. DIC Financial Chart Components

### 3.1 Revenue & HPP Chart
```typescript
// src/components/charts/RevenueHPPChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface DataPoint {
  periode: string;
  penjualan: number;
  hpp: number;
}

function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const penjualan = payload.find((p) => p.name === "penjualan");
  const hpp = payload.find((p) => p.name === "hpp");
  const rasio = penjualan && hpp
    ? ((hpp.value / penjualan.value) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card-hover p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-2">{label}</p>
      <p className="text-primary-600">Penjualan: <span className="font-bold">{formatRupiah(penjualan?.value ?? 0)}</span></p>
      <p className="text-negative-600">HPP: <span className="font-bold">{formatRupiah(hpp?.value ?? 0)}</span></p>
      {rasio && <p className="text-slate-500 mt-1">% HPP/Sales: <span className="font-bold">{rasio}%</span></p>}
    </div>
  );
}

export function RevenueHPPChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Penjualan & HPP</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gPenjualan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gHPP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <Tooltip content={<RevenueTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="penjualan" stroke="#3B82F6" strokeWidth={2}
            fill="url(#gPenjualan)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="hpp" stroke="#F43F5E" strokeWidth={2}
            fill="url(#gHPP)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 3.2 Donut Chart (Komposisi Aset / Rasio)
```typescript
// src/components/charts/DonutChart.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  title: string;
  centerLabel?: string;
  formatValue?: (v: number) => string;
}

function DonutTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DonutSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card-hover p-3 text-xs">
      <p className="font-semibold text-slate-800">{item.name}</p>
      <p className="text-slate-600">{formatRupiah(item.value)}</p>
    </div>
  );
}

export function DonutChart({ data, title, centerLabel }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="card flex flex-col items-center">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 self-start">{title}</h3>
      <div className="relative w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-sm font-bold text-slate-800">{centerLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3.3 Cash Flow Bar Chart
```typescript
// src/components/charts/CashFlowChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface CashFlowPoint {
  periode: string;
  penerimaan: number;
  pengeluaran: number;
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Arus Kas</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatRupiah(value),
              name === "penerimaan" ? "Penerimaan" : "Pengeluaran"
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="penerimaan" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 3.4 RKAP vs Realisasi Chart
```typescript
// src/components/charts/RKAPChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface RKAPPoint {
  periode: string;
  rkap: number;
  realisasi: number;
}

export function RKAPChart({ data }: { data: RKAPPoint[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Target RKAP vs Realisasi</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatRupiah(value),
              name === "rkap" ? "RKAP" : "Realisasi"
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="rkap" stroke="#94A3B8" strokeWidth={2}
            strokeDasharray="5 5" dot={false} />
          <Line type="monotone" dataKey="realisasi" stroke="#3B82F6" strokeWidth={2}
            dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 4. KAN Dashboard (Produksi AN)

```typescript
// src/features/portofolio/anak-cucu/KAN.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ANDataPoint {
  periode: string;
  target: number;
  realisasi: number;
}

function ProductionTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const target = payload.find((p) => p.name === "target");
  const realisasi = payload.find((p) => p.name === "realisasi");
  const achievement = target && realisasi && target.value > 0
    ? ((realisasi.value / target.value) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card-hover p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-2">{label}</p>
      <p className="text-slate-500">Target: <span className="font-bold">{target?.value.toLocaleString("id-ID")} Ton</span></p>
      <p className="text-positive-600">Realisasi: <span className="font-bold">{realisasi?.value.toLocaleString("id-ID")} Ton</span></p>
      {achievement && (
        <p className={parseFloat(achievement) >= 100 ? "text-positive-600" : "text-negative-600"}>
          Capaian: <span className="font-bold">{achievement}%</span>
        </p>
      )}
    </div>
  );
}
```

---

## 5. JODD & JODB Inventori Charts

```typescript
// src/components/charts/InventoriChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface InventoriPoint {
  periode: string;
  stok_awal: number;
  produksi: number;
  pengeluaran: number;
  stok_akhir: number;
}

const COLORS = {
  stok_awal: "#94A3B8",
  produksi: "#3B82F6",
  pengeluaran: "#F43F5E",
  stok_akhir: "#10B981",
};

export function InventoriChart({ data, title }: { data: InventoriPoint[]; title: string }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {(Object.entries(COLORS) as [keyof typeof COLORS, string][]).map(([key, color]) => (
            <Area key={key} type="monotone" dataKey={key} stroke={color}
              strokeWidth={1.5} fill={color} fillOpacity={0.08} dot={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 6. Investasi Bubble Chart (Lainnya)

```typescript
// src/features/portofolio/lainnya/Investasi.tsx
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface InvestasiItem {
  id: string;
  nama: string;
  nilai_investasi: number;
  roi_persen: number;
  risiko_score: number;
  status: "aktif" | "prospek" | "ditangguhkan";
}

const STATUS_COLORS: Record<string, string> = {
  aktif: "#10B981",
  prospek: "#3B82F6",
  ditangguhkan: "#94A3B8",
};

function InvestasiTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: InvestasiItem }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card-hover p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-1">{item.nama}</p>
      <p className="text-slate-600">Nilai: {formatRupiah(item.nilai_investasi)}</p>
      <p className="text-positive-600">ROI: {item.roi_persen}%</p>
      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-white text-[10px]
        ${item.status === "aktif" ? "bg-positive-500" :
          item.status === "prospek" ? "bg-primary-500" : "bg-slate-400"}`}>
        {item.status}
      </span>
    </div>
  );
}
```

---

## 📌 Prompt AI — Modul 06

```
Bangun Modul Manajemen Portofolio untuk Dahana BizPort.

Komponen yang dibutuhkan:
1. RevenueHPPChart (Recharts AreaChart) — Penjualan vs HPP dengan tooltip
   menampilkan nilai Rupiah dan % HPP/Sales
2. DonutChart (Recharts PieChart) — Komposisi Aset (Lancar vs Tidak Lancar)
   dengan center label total nilai
3. CashFlowChart (Recharts BarChart) — Penerimaan vs Pengeluaran (bar ganda)
4. RKAPChart (Recharts LineChart) — Target RKAP (dashed) vs Realisasi (solid)
5. InventoriChart (Recharts AreaChart) — 4 area bertumpuk:
   Stok Awal, Produksi, Pengeluaran, Stok Akhir
6. InvestasiBubbleChart (Recharts ScatterChart) — bubble size = nilai investasi,
   sumbu X = ROI, sumbu Y = risiko, warna = status

Halaman yang perlu dibuat:
- features/portofolio/anak-cucu/DIC.tsx (gabungkan Revenue, Donut, CashFlow, RKAP)
- features/portofolio/anak-cucu/KAN.tsx (produksi AN bar chart + finansial ringkas)
- features/portofolio/jo/JODD.tsx (inventori Dayaprime 200gr + 400gr)
- features/portofolio/jo/JODB.tsx (inventori ANSOL + Granular)
- features/portofolio/lainnya/Investasi.tsx (bubble chart + document upload per proyek)

Format angka: gunakan formatRupiah() untuk nilai uang, .toLocaleString("id-ID") untuk angka produksi.
Kode clean, production-ready, tanpa komentar redundan.
```
