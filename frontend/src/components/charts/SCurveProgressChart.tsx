import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface SCurveProgressDataPoint {
  periode: string;
  rencana: number | null;
  realisasi: number | null;
}

interface SCurveProgressChartProps {
  data: SCurveProgressDataPoint[];
}

const formatYAxis = (value: number) => {
  return `${value.toFixed(0)}%`;
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
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-5 text-sm min-w-56 z-50">
      <p className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 uppercase tracking-widest text-[11px]">{label}</p>
      <div className="space-y-3">
        <div className="flex justify-between items-center gap-6">
          <span className="text-slate-500 font-medium text-xs">Target Waktu</span>
          <span className="font-bold text-slate-700">{rencana?.value != null ? `${rencana.value}%` : "-"}</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-primary-500 font-medium text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            Realisasi Aktual
          </span>
          <span className="font-black text-slate-900 text-base">{realisasi?.value != null ? `${realisasi.value}%` : "-"}</span>
        </div>
        {deviasi && (
          <div className="flex justify-between items-center gap-6 pt-3 mt-3 border-t border-slate-100/80">
            <span className="font-semibold text-slate-400 text-xs">Deviasi</span>
            <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${parseFloat(deviasi) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {parseFloat(deviasi) > 0 ? "+" : ""}{parseFloat(deviasi)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SCurveProgressChart({ data }: SCurveProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex items-center justify-center min-h-90 text-slate-400">
        <p className="text-sm font-medium">Data progres (Kurva S) belum tersedia</p>
      </div>
    );
  }

  let latestReal = 0;
  let devStatus = 0;
  const lastRealNode = [...data].reverse().find(d => d.realisasi != null);
  if (lastRealNode) {
    latestReal = lastRealNode.realisasi || 0;
    if (lastRealNode.rencana != null) {
      devStatus = latestReal - lastRealNode.rencana;
    }
  }

  return (
    <div className="w-full relative px-1 pt-6">
      
      {/* Big Headline */}
      <div className="absolute top-0 left-6 z-10 flex flex-col pointer-events-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Progres Terkini</span>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-slate-900 tracking-tighter">
            {latestReal.toFixed(1)}%
          </span>
          {devStatus !== 0 && (
            <span className={`text-sm font-bold flex items-center ${devStatus > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {devStatus > 0 ? '▲' : '▼'} {Math.abs(devStatus).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="w-full h-[380px] mt-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 50, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="periode" 
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
              tickMargin={15} 
              tickFormatter={(v) => v.substring(0, 3).toUpperCase()}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend 
              wrapperStyle={{ fontSize: 12, fontWeight: 600, top: "-10px" }} 
              iconType="circle" 
              verticalAlign="top"
              align="right"
              formatter={(value) => {
                if(value === "rencana") return <span className="text-slate-400 ml-1 mr-4">Target Waktu</span>;
                return <span className="text-primary-600 ml-1">Realisasi Aktual</span>;
              }}
            />
            
            <Area
              name="rencana"
              type="monotone"
              dataKey="rencana"
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="6 6"
              fill="none"
              dot={false}
              activeDot={{ r: 5, fill: "#cbd5e1", strokeWidth: 0 }}
              connectNulls
            />

            <Area
              name="realisasi"
              type="monotone"
              dataKey="realisasi"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorRealisasi)"
              dot={false}
              activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 3, stroke: "#ffffff", className: "shadow-sm" }}
              connectNulls
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
