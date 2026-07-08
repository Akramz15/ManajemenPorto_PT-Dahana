import { useChartData } from "@/hooks/useChartData";
import { InventoriChart } from "@/components/charts";
import { ExcelUploader } from "@/components/shared";

export default function JODD() {
  const { data: chartData, loading, refetch } = useChartData<any>("jodd");

  const inv200 = chartData?.data?.inventori_200gr || [];
  const inv400 = chartData?.data?.inventori_400gr || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 card p-6! border-0! bg-white/80! shadow-sm!">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Joint Operation Dahana - Dayaprime (JODD)</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Dashboard mutasi inventori Dayaprime 200gr dan 400gr</p>
        </div>
        
        <div className="w-full md:w-64">
          <ExcelUploader context="jodd" compact={true} onSuccess={() => refetch()} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <InventoriChart title="Mutasi Inventori Dayaprime 200gr" data={inv200} />
          <InventoriChart title="Mutasi Inventori Dayaprime 400gr" data={inv400} />
        </div>
      )}
    </div>
  );
}
