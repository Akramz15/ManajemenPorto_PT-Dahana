import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
    <div className="apple-tooltip">
      <p className="apple-tooltip-title">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-6">
          <span className="text-blue-400 font-medium">Penjualan</span>
          <span className="font-bold text-white">{formatRupiah(penjualan?.value ?? 0)}</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-rose-400 font-medium">HPP</span>
          <span className="font-bold text-white">{formatRupiah(hpp?.value ?? 0)}</span>
        </div>
        {rasio && (
          <div className="flex justify-between items-center gap-6 pt-2 mt-2 border-t border-slate-700/50">
            <span className="font-semibold text-slate-400">% HPP/Sales</span>
            <span className="font-bold text-slate-200">{rasio}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueHPPChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="card w-full">
      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">Penjualan & HPP</h3>
      <p className="text-xs font-medium text-slate-500 mb-8">Tren pendapatan operasional</p>
      
      <div className="w-full h-70">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gPenjualan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gHPP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={16} />
            <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px", fontWeight: 600 }} iconType="circle" />
            <Area type="monotone" name="penjualan" dataKey="penjualan" stroke="#3B82F6" strokeWidth={3.5}
              fill="url(#gPenjualan)" dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }} 
              isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
            <Area type="monotone" name="hpp" dataKey="hpp" stroke="#F43F5E" strokeWidth={3.5}
              fill="url(#gHPP)" dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#F43F5E' }} 
              isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
