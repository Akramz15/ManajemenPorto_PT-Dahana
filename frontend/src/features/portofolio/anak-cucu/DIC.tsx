import { useState } from "react";
import { useChartData } from "@/hooks/useChartData";
import { RevenueHPPChart, DonutChart, CashFlowChart, RKAPChart, EkuitasChart } from "@/components/charts";
import { formatRupiah } from "@/lib/formatters";
import { ExcelUploader } from "@/components/shared";

type RkapType = "ytd" | "bulanan";

export default function DIC() {
  const { data: chartData, refetch, loading } = useChartData<any>("dic");
  const [selectedRkap, setSelectedRkap] = useState<RkapType>("ytd");

  const revenueData = chartData?.data?.revenue || [];
  const komposisiAset = chartData?.data?.komposisi_aset || [];
  const ekuitasDetail = chartData?.data?.ekuitas_detail || { modal_saham: 0, disagio_saham: 0, tambahan_modal: 0, saldo_laba: 0 };
  const cashFlow = chartData?.data?.cash_flow || [];
  
  const rkapDataLabaRugi = chartData?.data?.rkap_laba_rugi || [];
  const rkapDataPendapatan = chartData?.data?.rkap_pendapatan || [];
  const rkapDataYtdPendapatan = chartData?.data?.rkap_ytd_pendapatan || [];
  const rkapDataYtdLabaRugi = chartData?.data?.rkap_ytd_laba_rugi || [];
  const totalAset = komposisiAset.reduce((acc: number, d: any) => acc + d.value, 0);



  if (loading && !chartData) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 card p-6! border-0! bg-white/80! shadow-sm!">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">PT Dahana Investama Corp (DIC)</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Dashboard kinerja finansial dan operasional anak perusahaan</p>
        </div>
        
        <div className="w-full md:w-64">
          <ExcelUploader context="dic" compact={true} onSuccess={() => refetch()} />
        </div>
      </div>

      <div className="space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8">
          <RKAPChart 
            data={selectedRkap === "ytd" ? rkapDataYtdPendapatan : rkapDataPendapatan} 
            title={selectedRkap === "ytd" ? "YTD Pendapatan DIC 2026 RKAP vs Realisasi" : "Pendapatan DIC 2026 RKAP vs Realisasi (Per Bulan)"} 
            headerAction={
              <select 
                value={selectedRkap}
                onChange={(e) => setSelectedRkap(e.target.value as RkapType)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium cursor-pointer shadow-sm"
              >
                <option value="ytd">YTD (Akumulasi)</option>
                <option value="bulanan">Per Bulan</option>
              </select>
            }
          />
          <RKAPChart 
            data={selectedRkap === "ytd" ? rkapDataYtdLabaRugi : rkapDataLabaRugi} 
            title={selectedRkap === "ytd" ? "YTD Laba Rugi DIC 2026 RKAP vs Realisasi" : "Laba Rugi Usaha DIC 2026 RKAP vs Realisasi (Per Bulan)"} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <DonutChart 
              title="Komposisi Aset"
              data={komposisiAset} 
              centerLabel={formatRupiah(totalAset, true)}
            />
          </div>
          <div className="lg:col-span-2">
            <EkuitasChart data={ekuitasDetail} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <CashFlowChart data={cashFlow} />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <RevenueHPPChart data={revenueData} />
        </div>
      </div>
    </div>
  );
}
