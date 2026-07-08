import { useChartData } from "@/hooks/useChartData";
import { RKAPChart, RevenueHPPChart } from "@/components/charts";
import { ExcelUploader } from "@/components/shared";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function KANProduksiTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const target = payload.find((p) => p.name === "target");
  const realisasi = payload.find((p) => p.name === "realisasi");

  return (
    <div className="apple-tooltip">
      <p className="apple-tooltip-title">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-6">
          <span className="text-slate-400 font-medium">Target</span>
          <span className="font-bold text-white">{target?.value?.toLocaleString("id-ID") ?? 0} Ton</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-emerald-400 font-medium">Realisasi</span>
          <span className="font-bold text-white">{realisasi?.value?.toLocaleString("id-ID") ?? 0} Ton</span>
        </div>
      </div>
    </div>
  );
}

export default function KAN() {
  const { data: chartData, refetch } = useChartData<any>("kan");

  const produksiData = chartData?.data?.produksi || [];
  const revenueData = chartData?.data?.revenue || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 card p-6! border-0! bg-white/80! shadow-sm!">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">PT Kaltim Amonium Nitrat (KAN)</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Dashboard pencapaian produksi AN dan ringkasan finansial</p>
        </div>
        
        <div className="w-full md:w-64">
          <ExcelUploader context="kan" compact={true} onSuccess={() => refetch()} />
        </div>
      </div>

      <div className="space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RKAPChart data={chartData?.data?.rkap || []} />
        </div>

        <div className="card w-full">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-1">Pencapaian Produksi Amonium Nitrat (AN)</h3>
          <p className="text-xs font-medium text-slate-500 mb-8">Volume target vs realisasi (Ton)</p>
          
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produksiData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={6}>
                <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={16} />
                <YAxis tickFormatter={(v) => `${v.toLocaleString("id-ID")}T`} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
                <Tooltip content={<KANProduksiTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: "20px", fontWeight: 600 }} iconType="circle" />
                <Bar name="target" dataKey="target" fill="#94A3B8" radius={[6, 6, 0, 0]} maxBarSize={50} fillOpacity={0.4} />
                <Bar name="realisasi" dataKey="realisasi" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <RevenueHPPChart data={revenueData} />
        </div>
      </div>
    </div>
  );
}
