import {
  AreaChart, Area, XAxis, YAxis,
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

const ALL_MONTHS = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

const formatYAxis = (value: number) => {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(0)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}Jt`;
  if (value === 0) return "Rp 0";
  return value.toLocaleString('id-ID');
};

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
    <div className="apple-tooltip">
      <p className="apple-tooltip-title">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-6">
          <span className="text-slate-400 font-medium">Target (RKAP)</span>
          <span className="font-bold text-white">{rencana?.value != null ? rencana.value.toLocaleString('id-ID') : "-"}</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            Realisasi
          </span>
          <span className="font-black text-white">{realisasi?.value != null ? realisasi.value.toLocaleString('id-ID') : "-"}</span>
        </div>
        {deviasi && (
          <div className="flex justify-between items-center gap-6 pt-2 mt-2 border-t border-slate-700/50">
            <span className="font-semibold text-slate-400 text-xs">Deviasi</span>
            <span className={`font-bold text-xs ${parseFloat(deviasi) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {parseFloat(deviasi) > 0 ? "+" : ""}{parseFloat(deviasi).toLocaleString('id-ID')}
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

  // Calculate the current active Realisasi to show as a big headline (Stock style)
  let latestReal = 0;
  let devStatus = 0;
  const lastRealNode = [...data].reverse().find(d => d.realisasi != null);
  if (lastRealNode) {
    latestReal = lastRealNode.realisasi || 0;
    if (lastRealNode.rencana != null) {
      devStatus = latestReal - lastRealNode.rencana;
    }
  }

  // Pad data up to 12 months
  const paddedData = ALL_MONTHS.map(month => {
    const existing = data.find(d => {
      if (!d.periode) return false;
      const p = d.periode.toUpperCase();
      const m = month.toUpperCase();
      return p === m || m.startsWith(p) || p.startsWith(m.substring(0, 3));
    });
    if (existing) return { ...existing, periode: month };
    return { periode: month, rencana: null, realisasi: null };
  });

  return (
    <div className="w-full flex-1 relative flex flex-col min-h-0">
      
      {/* Big Headline (Stock Style Normal Flow) */}
      <div className="px-6 flex flex-col mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Realisasi Terkini</span>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-slate-900 tracking-tighter">
            Rp {latestReal.toLocaleString('id-ID')}
          </span>
          {devStatus !== 0 && (
            <span className={`text-sm font-bold flex items-center ${devStatus > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {devStatus > 0 ? '▲' : '▼'} {Math.abs(devStatus).toLocaleString('id-ID')}
            </span>
          )}
        </div>
      </div>

      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={paddedData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="periode" 
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
              tickMargin={15} 
              tickFormatter={(v) => v.substring(0, 3).toUpperCase()}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickMargin={15}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 40, opacity: 0.5 }} />
            <Legend 
              wrapperStyle={{ fontSize: 12, fontWeight: 600, top: "-10px" }} 
              iconType="circle" 
              verticalAlign="top"
              align="right"
              formatter={(value) => {
                if(value === "rencana") return <span className="text-slate-400 ml-1 mr-4">Target (RKAP)</span>;
                return <span className="text-emerald-600 ml-1">Realisasi</span>;
              }}
            />
            
            {/* Target Line - Subtle Dashed */}
            <Area
              name="rencana"
              type="monotone"
              dataKey="rencana"
              stroke="#cbd5e1"
              strokeWidth={3}
              strokeDasharray="6 6"
              fill="none"
              dot={false}
              activeDot={{ r: 5, fill: "#cbd5e1", strokeWidth: 0 }}
              connectNulls
            />

            {/* Actual Line - Smooth Stock Curve */}
            <Area
              name="realisasi"
              type="monotone"
              dataKey="realisasi"
              stroke="#10B981"
              strokeWidth={4}
              fill="url(#colorRealisasi)"
              dot={false}
              activeDot={{ r: 6, fill: "#10B981", strokeWidth: 3, stroke: "#ffffff", className: "shadow-sm" }}
              connectNulls
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
