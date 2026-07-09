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
    <div className="apple-tooltip">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }}></div>
        <p className="apple-tooltip-title mb-0! pb-0! border-0!">{item.name}</p>
      </div>
      <p className="text-white font-bold">{formatter(item.value)}</p>
    </div>
  );
}

export function DonutChart({ data, title, centerLabel, formatValue }: DonutChartProps) {
  // Format centerLabel to Miliar if it is too long (assuming centerLabel is a string starting with Rp)
  const formatCenterLabel = (label: string | undefined) => {
    if (!label) return "";
    const numMatch = label.replace(/[Rp.\s]/g, "");
    const num = parseInt(numMatch);
    if (!isNaN(num) && num >= 1e9) {
      return `Rp${(num / 1e9).toFixed(1)} M`;
    }
    return label;
  };

  const formattedCenter = centerLabel ? formatCenterLabel(centerLabel) : undefined;

  return (
    <div className="card w-full relative">
      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-8 z-10">{title}</h3>
      <div className="w-full relative z-10 h-70">
        {formattedCenter && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-lg font-black text-slate-900">{formattedCenter}</p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={6}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} className="transition-all hover:opacity-80 hover:scale-[1.02] origin-center" />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip formatValue={formatValue} />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px", fontWeight: 600 }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
