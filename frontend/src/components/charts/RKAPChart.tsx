import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface RKAPPoint {
  periode: string;
  rkap: number;
  realisasi: number;
}

function RKAPTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const rkap = payload.find((p: any) => p.dataKey === "rkap");
  const realisasi = payload.find((p: any) => p.dataKey === "realisasi");
  
  const deviasi = (realisasi?.value != null && rkap?.value != null)
    ? (Number(realisasi.value) - Number(rkap.value))
    : null;

  return (
    <div className="apple-tooltip">
      <p className="apple-tooltip-title">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-6">
          <span className="text-slate-400 font-medium">Target RKAP</span>
          <span className="font-bold text-white">{formatRupiah(rkap?.value ?? 0)}</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            Realisasi
          </span>
          <span className="font-black text-white">{formatRupiah(realisasi?.value ?? 0)}</span>
        </div>
        
        {deviasi && (
          <div className="flex justify-between items-center gap-6 pt-2 mt-2 border-t border-slate-700/50">
            <span className="font-semibold text-slate-400 text-xs">Deviasi</span>
            <span className={`font-bold text-xs ${deviasi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {deviasi > 0 ? "+" : ""}{formatRupiah(deviasi)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const ALL_MONTHS = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

const formatYAxis = (value: number) => {
  if (value >= 1_000_000_000_000) return `Rp${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(0)}M`;
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(0)}Jt`;
  if (value === 0) return "Rp0";
  return value.toLocaleString('id-ID');
};

export function RKAPChart({ data, title = "Target RKAP vs Realisasi (Terkini)", headerAction }: { data: RKAPPoint[], title?: string, headerAction?: React.ReactNode }) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex items-center justify-center min-h-100 text-slate-400">
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
    if (lastRealNode.rkap != null) {
      devStatus = latestReal - lastRealNode.rkap;
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
    return { periode: month, rkap: null, realisasi: null };
  });

  return (
    <div className="card p-6! border-0! bg-white/80! shadow-sm! relative overflow-hidden h-125 w-full flex flex-col">
      <div className="flex items-center justify-between z-10 mb-6 px-1 relative">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
          {title}
        </h3>
        {headerAction && (
          <div className="flex-shrink-0">
            {headerAction}
          </div>
        )}
      </div>

      <div className="w-full flex-1 relative flex flex-col min-h-0">
        <div className="px-1 flex flex-col mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Realisasi Terkini</span>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              {formatRupiah(latestReal)}
            </span>
            {devStatus !== 0 && (
              <span className={`text-sm font-bold flex items-center ${devStatus > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {devStatus > 0 ? '▲' : '▼'} {formatRupiah(Math.abs(devStatus))}
              </span>
            )}
          </div>
        </div>

        <div className="w-full flex-1 min-h-0 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={paddedData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRKAPRealisasi" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={formatYAxis} 
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
                tickMargin={15} 
              />
              <Tooltip content={<RKAPTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 40, opacity: 0.5 }} />
              <Legend 
                wrapperStyle={{ fontSize: 12, fontWeight: 600, top: "-20px", right: "10px" }} 
                iconType="circle" 
                verticalAlign="top"
                align="right"
                formatter={(value) => {
                  if(value === "rkap") return <span className="text-slate-400 ml-1 mr-4">Target (RKAP)</span>;
                  return <span className="text-emerald-600 ml-1">Realisasi</span>;
                }}
              />              
              <Area 
                name="rkap" 
                type="monotone" 
                dataKey="rkap" 
                stroke="#cbd5e1" 
                strokeWidth={3}
                strokeDasharray="6 6" 
                fill="none"
                dot={false} 
                activeDot={{ r: 5, fill: "#cbd5e1", strokeWidth: 0 }} 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Area 
                name="realisasi" 
                type="monotone" 
                dataKey="realisasi" 
                stroke="#10B981" 
                strokeWidth={4}
                fill="url(#colorRKAPRealisasi)"
                dot={false} 
                activeDot={{ r: 6, fill: "#10B981", strokeWidth: 3, stroke: "#ffffff", className: "shadow-sm" }} 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
