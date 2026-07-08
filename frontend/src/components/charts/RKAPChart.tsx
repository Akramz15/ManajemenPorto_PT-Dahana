import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface RKAPPoint {
  periode: string;
  rkap: number;
  realisasi: number;
}

export function RKAPChart({ data }: { data: RKAPPoint[] }) {
  return (
    <div className="card w-full">
      <h3 className="text-sm font-bold text-slate-800 mb-1">Target RKAP vs Realisasi</h3>
      <p className="text-xs text-slate-500 mb-6">Pencapaian dibandingkan rencana kerja anggaran</p>
      
      <div className="w-full h-70">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={8} />
            <Tooltip
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: any) => [
                <span key="value" className="font-bold text-slate-800">{formatRupiah(value)}</span>,
                <span key="name" className="capitalize font-medium text-slate-600">{name}</span>
              ]}
              labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "15px" }} iconType="circle" />
            <Line name="rkap" type="monotone" dataKey="rkap" stroke="#94A3B8" strokeWidth={2.5}
              strokeDasharray="6 4" dot={false} activeDot={{ r: 4 }} />
            <Line name="realisasi" type="monotone" dataKey="realisasi" stroke="#3B82F6" strokeWidth={3}
              dot={{ r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
