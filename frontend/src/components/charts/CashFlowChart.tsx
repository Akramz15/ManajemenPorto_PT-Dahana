import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface CashFlowPoint {
  periode: string;
  cfo_terima: number;
  cfo_keluar: number;
  cfi_terima: number;
  cfi_keluar: number;
  cff_terima: number;
  cff_keluar: number;
}

function CashFlowTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const penerimaan = payload.find((p) => p.dataKey === "penerimaan");
  const pengeluaran = payload.find((p) => p.dataKey === "pengeluaran");

  return (
    <div className="apple-tooltip">
      <p className="apple-tooltip-title">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-6">
          <span className="text-emerald-400 font-medium">Penerimaan</span>
          <span className="font-bold text-white">{formatRupiah(penerimaan?.value ?? 0)}</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-rose-400 font-medium">Pengeluaran</span>
          <span className="font-bold text-white">{formatRupiah(pengeluaran?.value ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  const [kategori, setKategori] = useState<"cfo" | "cfi" | "cff">("cfo");

  const chartData = data.map(d => ({
    periode: d.periode,
    penerimaan: d[`${kategori}_terima`],
    pengeluaran: d[`${kategori}_keluar`] ? -d[`${kategori}_keluar`] : null
  }));

  const yAxisFormatter = (v: number) => {
    return `${(Math.abs(v) / 1e9).toFixed(0)}M`;
  };

  return (
    <div className="card w-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">Arus Kas (Cash Flow)</h3>
          <p className="text-xs font-medium text-slate-500">Penerimaan vs Pengeluaran per kategori</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Kategori:</label>
          <select 
            value={kategori} 
            onChange={(e) => setKategori(e.target.value as "cfo" | "cfi" | "cff")}
            className="text-sm border-slate-200 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white font-medium text-slate-700 py-1.5 px-3 cursor-pointer outline-none transition-all duration-200 hover:bg-slate-50"
          >
            <option value="cfo">Aktivitas Operasi (CFO)</option>
            <option value="cfi">Aktivitas Investasi (CFI)</option>
            <option value="cff">Aktivitas Funding (CFF)</option>
          </select>
        </div>
      </div>
      
      <div className="w-full h-70">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <Tooltip content={<CashFlowTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px", fontWeight: 600 }} iconType="circle" />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            
            <Bar name="Penerimaan" dataKey="penerimaan" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar name="Pengeluaran" dataKey="pengeluaran" fill="#F43F5E" radius={[0, 0, 4, 4]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
