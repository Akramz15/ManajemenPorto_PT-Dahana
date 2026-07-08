import { useChartData } from "@/hooks/useChartData";
import { RevenueHPPChart, DonutChart, CashFlowChart, RKAPChart } from "@/components/charts";
import { formatRupiah } from "@/lib/formatters";
import { ExcelUploader } from "@/components/shared";

export default function DIC() {
  const { data: chartData, loading, refetch } = useChartData<any>("dic", "finansial");

  const revenueData = chartData?.data?.revenue || [];
  const komposisiAset = chartData?.data?.komposisi_aset || [];
  const cashFlow = chartData?.data?.cash_flow || [];
  const rkapData = chartData?.data?.rkap || [];
  const totalAset = komposisiAset.reduce((acc: number, d: any) => acc + d.value, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">PT Dahana Investama Corp (DIC)</h2>
          <p className="text-sm text-slate-500 mt-1">Dashboard kinerja finansial dan operasional anak perusahaan</p>
        </div>
        
        <div className="w-full md:w-64">
          <ExcelUploader context="dic" onSuccess={() => refetch()} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueHPPChart data={revenueData} />
            </div>
            <div className="lg:col-span-1">
              <DonutChart 
                title="Komposisi Aset"
                data={komposisiAset} 
                centerLabel={formatRupiah(totalAset)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashFlowChart data={cashFlow} />
            <RKAPChart data={rkapData} />
          </div>
        </div>
      )}
    </div>
  );
}
