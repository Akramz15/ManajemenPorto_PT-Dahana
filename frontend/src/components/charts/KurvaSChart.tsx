import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LabelList
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
          <span className="text-[#4472C4] font-medium">RKAP</span>
          <span className="font-bold text-slate-800">{rencana?.value != null ? rencana.value.toLocaleString('id-ID') : "-"}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-[#ED7D31] font-medium">Realisasi</span>
          <span className="font-bold text-slate-800">{realisasi?.value != null ? realisasi.value.toLocaleString('id-ID') : "-"}</span>
        </div>
        {deviasi && (
          <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-600">Deviasi</span>
            <span className={`font-bold ${parseFloat(deviasi) >= 0 ? "text-positive-600" : "text-negative-600"}`}>
              {parseFloat(deviasi) > 0 ? "+" : ""}{parseFloat(deviasi).toLocaleString('id-ID')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom formatter for the labels on the chart (to show e.g. "2.854" like in Excel)
const labelFormatter = (value: number | null) => {
  if (value == null) return "";
  return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
};

export function KurvaSChart({ data }: KurvaSChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex items-center justify-center min-h-90 text-slate-400">
        <p className="text-sm font-medium">Data grafik belum tersedia</p>
      </div>
    );
  }

  return (
    <div className="w-full relative px-2 pt-6">
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} />
            <XAxis 
              dataKey="periode" 
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} 
              axisLine={{ stroke: '#cbd5e1' }} 
              tickLine={{ stroke: '#cbd5e1' }} 
              tickMargin={15} 
              tickFormatter={(v) => v.substring(0, 3).toUpperCase()} // JAN, FEB, MAR
            />
            <YAxis 
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => val.toLocaleString('id-ID')}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend 
              wrapperStyle={{ fontSize: 12, fontWeight: 500, paddingTop: "10px" }} 
              iconType="circle" 
              verticalAlign="top"
              align="right"
              formatter={(value) => {
                if(value === "rencana") return <span className="text-slate-700 ml-1 mr-4">RKAP</span>;
                return <span className="text-slate-700 ml-1">Realisasi</span>;
              }}
            />
            
            {/* RKAP Line - Excel Blue */}
            <Line
              name="rencana"
              type="linear"
              dataKey="rencana"
              stroke="#4472C4"
              strokeWidth={2}
              dot={{ r: 5, fill: "#4472C4", strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "#4472C4", strokeWidth: 0 }}
              connectNulls
            >
              <LabelList 
                dataKey="rencana" 
                position="top" 
                offset={10}
                formatter={labelFormatter}
                style={{ fontSize: '11px', fill: '#334155', fontWeight: 600 }}
              />
            </Line>

            {/* Realisasi Line - Excel Orange */}
            <Line
              name="realisasi"
              type="linear"
              dataKey="realisasi"
              stroke="#ED7D31"
              strokeWidth={2}
              dot={{ r: 5, fill: "#ED7D31", strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "#ED7D31", strokeWidth: 0 }}
              connectNulls
            >
              <LabelList 
                dataKey="realisasi" 
                position="bottom" 
                offset={10}
                formatter={labelFormatter}
                style={{ fontSize: '11px', fill: '#334155', fontWeight: 600 }}
              />
            </Line>

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
