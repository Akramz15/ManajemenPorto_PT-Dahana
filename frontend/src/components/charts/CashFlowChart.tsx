import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface CashFlowPoint {
  periode: string;
  penerimaan: number;
  pengeluaran: number;
}

function CashFlowTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const penerimaan = payload.find((p) => p.name === "penerimaan");
  const pengeluaran = payload.find((p) => p.name === "pengeluaran");

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
  return (
    <div className="card w-full h-full flex flex-col">
      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">Arus Kas (Cash Flow)</h3>
      <p className="text-xs font-medium text-slate-500 mb-8">Penerimaan vs Pengeluaran per bulan</p>
      
      <div className="w-full flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <Tooltip content={<CashFlowTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px", fontWeight: 600 }} iconType="circle" />
            <Bar name="penerimaan" dataKey="penerimaan" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar name="pengeluaran" dataKey="pengeluaran" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
