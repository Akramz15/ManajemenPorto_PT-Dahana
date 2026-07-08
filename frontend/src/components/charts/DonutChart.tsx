import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  title: string;
  centerLabel?: string;
  formatValue?: (v: number) => string;
}

function DonutTooltip({ active, payload, formatValue }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DonutSlice }>;
  formatValue?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const formatter = formatValue || formatRupiah;
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card-hover p-3 text-xs min-w-32 flex flex-col items-center">
      <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: item.payload.color }}></div>
      <p className="font-bold text-slate-800 text-center">{item.name}</p>
      <p className="text-slate-600 text-center font-medium mt-1">{formatter(item.value)}</p>
    </div>
  );
}

export function DonutChart({ data, title, centerLabel, formatValue }: DonutChartProps) {
  return (
    <div className="card w-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
      <div className="relative w-full flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} className="transition-all hover:opacity-80" />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip formatValue={formatValue} />} />
            <Legend wrapperStyle={{ fontSize: 11, marginTop: "10px" }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-[15px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-sm font-black text-slate-800 mt-0.5">{centerLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
