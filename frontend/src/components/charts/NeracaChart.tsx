import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface NeracaPoint {
  periode: string;
  aset: number;
  liabilitas: number;
  ekuitas: number;
}

function NeracaTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;

  const aset = payload.find(p => p.name === "aset")?.value || 0;
  const liabilitas = payload.find(p => p.name === "liabilitas")?.value || 0;
  const ekuitas = payload.find(p => p.name === "ekuitas")?.value || 0;

  return (
    <div className="apple-tooltip !min-w-40">
      <p className="apple-tooltip-title">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-4">
          <span className="font-semibold" style={{ color: "#3B82F6" }}>Aset</span>
          <span className="font-bold text-white">{formatRupiah(aset)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="font-semibold" style={{ color: "#F43F5E" }}>Liabilitas</span>
          <span className="font-bold text-white">{formatRupiah(liabilitas)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="font-semibold" style={{ color: "#10B981" }}>Ekuitas</span>
          <span className="font-bold text-white">{formatRupiah(ekuitas)}</span>
        </div>
      </div>
    </div>
  );
}

export function NeracaChart({ data, title = "Neraca Keseluruhan" }: { data: NeracaPoint[]; title?: string }) {
  // Format label sumbu Y agar menggunakan format M/B/T
  const yAxisFormatter = (value: number) => {
    if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(0)}M`;
    if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(0)}Jt`;
    return `Rp ${value}`;
  };

  return (
    <div className="card w-full h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs font-medium text-slate-500 mt-1">Aset, Liabilitas, dan Ekuitas</p>
        {/* DEBUG: */}
        <p className="text-[10px] text-red-500 max-h-20 overflow-auto">{JSON.stringify(data).substring(0, 300)}</p>
      </div>
      
      <div className="w-full flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis 
              dataKey="periode" 
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false}
              tickMargin={12}
            />
            <YAxis 
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
            />
            <Tooltip content={<NeracaTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
            <Bar name="aset" dataKey="aset" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={25} />
            <Bar name="liabilitas" dataKey="liabilitas" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={25} />
            <Bar name="ekuitas" dataKey="ekuitas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={25} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
