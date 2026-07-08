import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

export function InventoriChart({ data, title }: { data: InventoriPoint[]; title: string }) {
  return (
    <div className="card w-full">
      <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-6">Mutasi stok gudang per bulan</p>
      
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={8} />
            <Tooltip
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', minWidth: '180px' }}
              labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "15px" }} iconType="circle" />
            {(Object.entries(COLORS) as [keyof typeof COLORS, typeof COLORS[keyof typeof COLORS]][]).map(([key, config]) => (
              <Area 
                key={key} 
                name={config.label}
                type="monotone" 
                dataKey={key} 
                stroke={config.stroke}
                strokeWidth={2} 
                fill={config.fill} 
                fillOpacity={1} 
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: config.stroke }} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
