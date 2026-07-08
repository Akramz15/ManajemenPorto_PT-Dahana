import { useChartData } from "@/hooks/useChartData";
import { InventoriChart } from "@/components/charts";
import { ExcelUploader } from "@/components/shared";

export default function JODB() {
  const { data: chartData, loading, refetch } = useChartData<any>("jodb", "inventori");

  const invAnsol = chartData?.data?.inventori_ansol || [];
  const invGranular = chartData?.data?.inventori_granular || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Joint Operation Dahana - BB (JODB)</h2>
          <p className="text-sm text-slate-500 mt-1">Dashboard mutasi inventori ANSOL dan Granular</p>
        </div>
        
        <div className="w-full md:w-64">
          <ExcelUploader context="jodb" onSuccess={() => refetch()} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <InventoriChart title="Mutasi Inventori ANSOL" data={invAnsol} />
          <InventoriChart title="Mutasi Inventori Granular" data={invGranular} />
        </div>
      )}
    </div>
  );
}
