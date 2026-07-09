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

  const totalTerima = payload.filter(p => p.dataKey.includes('terima')).reduce((sum, p) => sum + (p.value || 0), 0);
  const totalKeluar = payload.filter(p => p.dataKey.includes('keluar')).reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <div className="apple-tooltip min-w-[280px]">
      <p className="apple-tooltip-title">{label}</p>
      
      <div className="mb-3 pb-3 border-b border-slate-700/50 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Total Penerimaan</span>
          <span className="font-bold text-white">{formatRupiah(totalTerima)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-rose-400 font-bold text-xs uppercase tracking-wider">Total Pengeluaran</span>
          <span className="font-bold text-white">{formatRupiah(totalKeluar)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {payload.filter(p => p.value).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300">{item.name}</span>
            </div>
            <span className="font-medium text-white">{formatRupiah(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  // We need to make sure Pengeluaran values are positive for stacked bar chart stacking downwards
  // Wait, in Recharts, if values are positive they stack UP. If we want them to go DOWN, 
  // we could just leave them as is (since backend returns positive numbers for pengeluaran due to abs())
  // Ah, wait! The backend returns POSITIVE numbers because I used `abs()`!
  // If I want them to stack DOWN on the chart, I should negate them before passing to BarChart.
  const chartData = data.map(d => ({
    ...d,
    cfo_keluar: d.cfo_keluar ? -d.cfo_keluar : null,
    cfi_keluar: d.cfi_keluar ? -d.cfi_keluar : null,
    cff_keluar: d.cff_keluar ? -d.cff_keluar : null,
  }));

  const yAxisFormatter = (v: number) => {
    return `${(Math.abs(v) / 1e9).toFixed(0)}M`;
  };

  return (
    <div className="card w-full">
      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">Arus Kas (Cash Flow)</h3>
      <p className="text-xs font-medium text-slate-500 mb-8">Rincian Operasi, Investasi, dan Pendanaan per bulan</p>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={0} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} stackOffset="sign">
            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
            <Tooltip content={<CashFlowTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px", fontWeight: 600 }} iconType="circle" />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            
            <Bar name="Terima Operasi" dataKey="cfo_terima" stackId="terima" fill="#10B981" />
            <Bar name="Terima Investasi" dataKey="cfi_terima" stackId="terima" fill="#34D399" />
            <Bar name="Terima Funding" dataKey="cff_terima" stackId="terima" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
            
            <Bar name="Keluar Operasi" dataKey="cfo_keluar" stackId="keluar" fill="#F43F5E" />
            <Bar name="Keluar Investasi" dataKey="cfi_keluar" stackId="keluar" fill="#FB7185" />
            <Bar name="Keluar Funding" dataKey="cff_keluar" stackId="keluar" fill="#FDA4AF" radius={[0, 0, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
