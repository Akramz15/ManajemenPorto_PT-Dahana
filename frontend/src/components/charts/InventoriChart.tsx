import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface InventoriPoint {
  periode: string;
  stok_awal: number;
  produksi: number;
  pengeluaran: number;
  stok_akhir: number;
}

const COLORS = {
  stok_awal: { stroke: "#94A3B8", fill: "#f1f5f9", label: "Stok Awal" },
  produksi: { stroke: "#3B82F6", fill: "#eff6ff", label: "Produksi" },
  pengeluaran: { stroke: "#F43F5E", fill: "#fff1f2", label: "Pengeluaran" },
  stok_akhir: { stroke: "#10B981", fill: "#f0fdf4", label: "Stok Akhir" },
};

function InventoriTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="apple-tooltip min-w-50 !important">
      <p className="apple-tooltip-title">{label}</p>
      <div className="space-y-2">
        {payload.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-6">
            <span className="font-medium" style={{ color: item.color }}>{item.name}</span>
            <span className="font-bold text-white">{item.value.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InventoriChart({ data, title, subtitle }: { data: InventoriPoint[]; title: string; subtitle: string }) {
  return (
    <div className="card w-full min-w-50">
      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">{title}</h3>
      <p className="text-xs font-medium text-slate-500 mb-8">{subtitle}</p>
      
      <div className="w-full h-75 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {(Object.entries(COLORS) as [keyof typeof COLORS, typeof COLORS[keyof typeof COLORS]][]).map(([key, config]) => (
                <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.stroke} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={config.stroke} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={16} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <Tooltip content={<InventoriTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px", fontWeight: 600 }} iconType="circle" />
            {(Object.entries(COLORS) as [keyof typeof COLORS, typeof COLORS[keyof typeof COLORS]][]).map(([key, config]) => (
              <Area 
                key={key} 
                name={config.label}
                type="monotone" 
                dataKey={key} 
                stroke={config.stroke}
                strokeWidth={3} 
                fill={`url(#grad-${key})`}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: config.stroke }} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
