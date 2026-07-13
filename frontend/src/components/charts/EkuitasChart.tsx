import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface EkuitasDetail {
  modal_saham: number;
  disagio_saham: number;
  tambahan_modal: number;
  saldo_laba: number;
}

function EkuitasTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const value = payload[0].value;
  const isNegative = value < 0;

  return (
    <div className="apple-tooltip min-w-50">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-3 h-3 rounded-full ${isNegative ? "bg-rose-500" : "bg-emerald-500"}`}
        />
        <p className="apple-tooltip-title mb-0!">{data.name}</p>
      </div>
      <div className="flex justify-between items-center gap-4">
        <span className="text-slate-400 font-medium">Nilai</span>
        <span
          className={`font-bold ${isNegative ? "text-rose-400" : "text-emerald-400"}`}
        >
          {formatRupiah(value)}
        </span>
      </div>
    </div>
  );
}

export function EkuitasChart({ data }: { data: EkuitasDetail }) {
  const chartData = [
    { name: "Modal Saham", value: data?.modal_saham || 0 },
    { name: "Disagio Saham", value: data?.disagio_saham || 0 },
    { name: "Tambahan Modal", value: data?.tambahan_modal || 0 },
    { name: "Saldo Laba", value: data?.saldo_laba || 0 },
  ];

  const totalEkuitas = chartData.reduce((acc, curr) => acc + curr.value, 0);

  // Custom label for Y-axis so it looks cleaner
  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#64748b"
          fontSize={11}
          fontWeight={600}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="card w-full h-full flex flex-col">
      <div className="space-y-3 mb-0!">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">
          Rincian Ekuitas
        </h3>
        <p className="text-xs font-medium text-slate-500">
          Total Ekuitas:{" "}
          <span className="font-bold text-slate-800">
            {formatRupiah(totalEkuitas, true)}
          </span>
        </p>
      </div>

      <div className="w-full relative flex-1 min-h-50 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={<CustomYAxisTick />}
              width={90}
            />
            <Tooltip
              content={<EkuitasTooltip />}
              cursor={{ fill: "#f1f5f9", opacity: 0.4 }}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" />

            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={24}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => {
                const isNegative = entry.value < 0;
                // If negative, radius should be on the left [4, 0, 0, 4]
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isNegative ? "#F43F5E" : "#10B981"}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
