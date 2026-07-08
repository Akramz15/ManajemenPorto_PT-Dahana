import { useChartData } from "@/hooks/useChartData";
import { RKAPChart, RevenueHPPChart } from "@/components/charts";
import { ExcelUploader } from "@/components/shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function KAN() {
  const { data: chartData, loading, refetch } = useChartData<any>("kan", "produksi");

  const produksiData = chartData?.data?.produksi || [];
  const revenueData = chartData?.data?.revenue || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">PT Kaltim Amonium Nitrat (KAN)</h2>
          <p className="text-sm text-slate-500 mt-1">Dashboard pencapaian produksi AN dan ringkasan finansial</p>
        </div>
        
        <div className="w-full md:w-64">
          <ExcelUploader context="kan" onSuccess={() => refetch()} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card w-full">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Pencapaian Produksi Amonium Nitrat (AN)</h3>
            <p className="text-xs text-slate-500 mb-6">Volume target vs realisasi (Ton)</p>
            
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produksiData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
                  <YAxis tickFormatter={(v) => `${v.toLocaleString("id-ID")}T`} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={8} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => [
                      <span key="value" className="font-bold text-slate-800">{value.toLocaleString("id-ID")} Ton</span>,
                      <span key="name" className="capitalize font-medium text-slate-600">{name}</span>
                    ]}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: "15px" }} iconType="circle" />
                  <Bar name="target" dataKey="target" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={50} fillOpacity={0.6} />
                  <Bar name="realisasi" dataKey="realisasi" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueHPPChart data={revenueData} />
            <RKAPChart data={chartData?.data?.rkap || []} />
          </div>
        </div>
      )}
    </div>
  );
}
