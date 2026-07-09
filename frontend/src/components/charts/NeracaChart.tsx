import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface NeracaItem {
  name: string;
  value: number;
  color: string;
}

function NeracaTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as NeracaItem;

  return (
    <div className="apple-tooltip !min-w-40">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="font-semibold text-slate-300">{data.name}</span>
      </div>
      <p className="font-bold text-white text-lg">{formatRupiah(data.value, true)}</p>
    </div>
  );
}

export function NeracaChart({ data, title = "Neraca Keseluruhan" }: { data: NeracaItem[]; title?: string }) {
  // Format label sumbu Y agar menggunakan format M/B/T
  const yAxisFormatter = (value: number) => {
    if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(0)}M`;
    if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(0)}Jt`;
    return `Rp ${value}`;
  };

  return (
    <div className="card w-full h-full min-h-[350px]">
      <div className="mb-6">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs font-medium text-slate-500 mt-1">Aset, Liabilitas, dan Ekuitas</p>
      </div>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} 
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
              width={70}
            />
            <Tooltip content={<NeracaTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey="value" 
              radius={[6, 6, 0, 0]} 
              barSize={60}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
