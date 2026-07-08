import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface KurvaSDataPoint {
  periode: string;
  rencana: number | null;
  realisasi: number | null;
}

interface KurvaSChartProps {
  data: KurvaSDataPoint[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const rencana = payload.find((p) => p.name === "rencana");
  const realisasi = payload.find((p) => p.name === "realisasi");
  const deviasi = (realisasi?.value != null && rencana?.value != null)
    ? (realisasi.value - rencana.value).toFixed(2)
    : null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-card-hover p-4 text-xs min-w-40 z-50">
      <p className="font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-4">
          <span className="text-slate-500 font-medium">Target</span>
          <span className="font-bold text-slate-800">{rencana?.value != null ? `${rencana.value}%` : "-"}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-positive-600 font-medium">Realisasi</span>
          <span className="font-bold text-slate-800">{realisasi?.value != null ? `${realisasi.value}%` : "-"}</span>
        </div>
        {deviasi && (
          <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-600">Deviasi</span>
            <span className={`font-bold ${parseFloat(deviasi) >= 0 ? "text-positive-600" : "text-negative-600"}`}>
              {parseFloat(deviasi) > 0 ? "+" : ""}{deviasi}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function KurvaSChart({ data }: KurvaSChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex items-center justify-center min-h-90 text-slate-400">
        <p className="text-sm font-medium">Data grafik belum tersedia</p>
      </div>
    );
  }

  // Calculate current metrics for floating card
  let currentMinggu = "MINGGU --";
  let achieved = 0;
  let deviasi = 0;

  // Find last data point with realisasi
  const lastReal = [...data].reverse().find(d => d.realisasi != null);
  if (lastReal) {
    currentMinggu = lastReal.periode.toUpperCase();
    achieved = lastReal.realisasi || 0;
    if (lastReal.rencana != null) {
      deviasi = Number((achieved - lastReal.rencana).toFixed(1));
    }
  }

  return (
    <div className="w-full relative px-2 pt-6">
      {/* Floating Card */}
      <div className="absolute top-8 left-6 z-10 bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800/50 flex flex-col items-center justify-center min-w-30">
        <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">{currentMinggu}</span>
        <span className="text-2xl font-black tracking-tight">{achieved}%</span>
        <span className="text-[11px] font-semibold mt-1 text-slate-300">Achieved</span>
        <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${deviasi >= 0 ? 'bg-positive-500/20 text-positive-400' : 'bg-negative-500/20 text-negative-400'}`}>
          {deviasi > 0 ? "+" : ""}{deviasi}% Deviasi
        </div>
      </div>

      <div className="w-full h-95">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="periode" 
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} 
              axisLine={{ stroke: '#f1f5f9' }} 
              tickLine={false} 
              tickMargin={15} 
              tickFormatter={(v) => v.toUpperCase()}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend 
              wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: "10px", paddingBottom: "20px" }} 
              iconType="plainline" 
              verticalAlign="top"
              align="right"
              formatter={(value) => {
                if(value === "rencana") return <span className="text-slate-600">Garis Rencana (Target)</span>;
                return <span className="text-positive-600">Garis Realisasi (Actual)</span>;
              }}
            />
            {/* Target Line - Dashed Gray */}
            <Area
              name="rencana"
              type="monotone"
              dataKey="rencana"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="6 6"
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: "#94a3b8", strokeWidth: 0 }}
              connectNulls
            />
            {/* Actual Line - Solid Green with Gradient Area */}
            <Area
              name="realisasi"
              type="monotone"
              dataKey="realisasi"
              stroke="#10B981"
              strokeWidth={3}
              fill="url(#colorRealisasi)"
              dot={false}
              activeDot={{ r: 6, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
