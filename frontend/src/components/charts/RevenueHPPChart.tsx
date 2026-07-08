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
  const rasio = penjualan && hpp && penjualan.value > 0
    ? ((hpp.value / penjualan.value) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-card-hover p-4 text-xs min-w-48">
      <p className="font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-4">
          <span className="text-primary-600 font-medium">Penjualan</span>
          <span className="font-bold text-slate-800">{formatRupiah(penjualan?.value ?? 0)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-negative-600 font-medium">HPP</span>
          <span className="font-bold text-slate-800">{formatRupiah(hpp?.value ?? 0)}</span>
        </div>
        {rasio && (
          <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-600">% HPP / Sales</span>
            <span className="font-bold text-slate-800">{rasio}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueHPPChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="card w-full">
      <h3 className="text-sm font-bold text-slate-800 mb-1">Penjualan & HPP</h3>
      <p className="text-xs text-slate-500 mb-6">Tren pendapatan operasional</p>
      
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gPenjualan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gHPP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={8} />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "15px" }} iconType="circle" />
            <Area type="monotone" name="penjualan" dataKey="penjualan" stroke="#3B82F6" strokeWidth={2.5}
              fill="url(#gPenjualan)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} connectNulls />
            <Area type="monotone" name="hpp" dataKey="hpp" stroke="#F43F5E" strokeWidth={2.5}
              fill="url(#gHPP)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
