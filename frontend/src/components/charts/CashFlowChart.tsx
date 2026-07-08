import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface CashFlowPoint {
  periode: string;
  penerimaan: number;
  pengeluaran: number;
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <div className="card w-full">
      <h3 className="text-sm font-bold text-slate-800 mb-1">Arus Kas (Cash Flow)</h3>
      <p className="text-xs text-slate-500 mb-6">Penerimaan vs Pengeluaran per bulan</p>
      
      <div className="w-full h-70">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={8} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: any) => [
                <span key="value" className="font-bold text-slate-800">{formatRupiah(value)}</span>,
                <span key="name" className="capitalize font-medium text-slate-600">{name}</span>
              ]}
              labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "15px" }} iconType="circle" />
            <Bar name="penerimaan" dataKey="penerimaan" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar name="pengeluaran" dataKey="pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
