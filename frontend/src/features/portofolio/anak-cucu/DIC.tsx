import { useChartData } from "@/hooks/useChartData";
import { RevenueHPPChart, DonutChart, CashFlowChart, RKAPChart } from "@/components/charts";
import { formatRupiah } from "@/lib/formatters";
import { ExcelUploader } from "@/components/shared";

export default function DIC() {
  const { data: chartData, loading, refetch } = useChartData<any>("dic");

  const revenueData = chartData?.data?.revenue || [];
  const komposisiAset = chartData?.data?.komposisi_aset || [];
  const cashFlow = chartData?.data?.cash_flow || [];
  const rkapData = chartData?.data?.rkap || [];
  const totalAset = komposisiAset.reduce((acc: number, d: any) => acc + d.value, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 card !p-6 !border-0 !bg-white/80 !shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">PT Dahana Investama Corp (DIC)</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Dashboard kinerja finansial dan operasional anak perusahaan</p>
        </div>
        
        <div className="w-full md:w-64">
          <ExcelUploader context="dic" compact={true} onSuccess={() => refetch()} />
        </div>
      </div>

      <div className="space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RKAPChart data={rkapData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RevenueHPPChart data={revenueData} />
          </div>
          <div className="lg:col-span-1">
            <DonutChart 
              title="Komposisi Aset"
              data={komposisiAset} 
              centerLabel={formatRupiah(totalAset, true)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <CashFlowChart data={cashFlow} />
        </div>
      </div>
    </div>
  );
}
