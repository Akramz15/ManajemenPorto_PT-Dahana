import { useState } from "react";
import { useChartData } from "@/hooks/useChartData";
import { RevenueHPPChart, DonutChart, CashFlowChart, RKAPChart, NeracaChart } from "@/components/charts";
import { formatRupiah } from "@/lib/formatters";
import { ExcelUploader } from "@/components/shared";

type RkapType = "laba_rugi" | "ytd_pendapatan" | "ytd_laba_rugi";

export default function DIC() {
  const { data: chartData, refetch } = useChartData<any>("dic");
  const [selectedRkap, setSelectedRkap] = useState<RkapType>("ytd_pendapatan");

  const revenueData = chartData?.data?.revenue || [];
  const komposisiAset = chartData?.data?.komposisi_aset || [];
  const neracaData = chartData?.data?.neraca || [];
  const cashFlow = chartData?.data?.cash_flow || [];
  
  const rkapDataLabaRugi = chartData?.data?.rkap_laba_rugi || [];
  const rkapDataYtdPendapatan = chartData?.data?.rkap_ytd_pendapatan || [];
  const rkapDataYtdLabaRugi = chartData?.data?.rkap_ytd_laba_rugi || [];
  const totalAset = komposisiAset.reduce((acc: number, d: any) => acc + d.value, 0);

  const getActiveRkapData = () => {
    switch (selectedRkap) {
      case "laba_rugi": return { data: rkapDataLabaRugi, title: "Laba Rugi Usaha DIC 2026 RKAP vs Realisasi" };
      case "ytd_pendapatan": return { data: rkapDataYtdPendapatan, title: "YTD Pendapatan DIC 2026 RKAP vs Realisasi" };
      case "ytd_laba_rugi": return { data: rkapDataYtdLabaRugi, title: "YTD Laba Rugi DIC 2026 RKAP vs Realisasi" };
    }
  };

  const activeRkap = getActiveRkapData();

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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RKAPChart 
            data={activeRkap.data} 
            title={activeRkap.title} 
            headerAction={
              <select 
                value={selectedRkap}
                onChange={(e) => setSelectedRkap(e.target.value as RkapType)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium cursor-pointer shadow-sm"
              >
                <option value="ytd_pendapatan">YTD Pendapatan</option>
                <option value="laba_rugi">Laba Rugi Usaha</option>
                <option value="ytd_laba_rugi">YTD Laba Rugi</option>
              </select>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <div className="lg:col-span-2 flex">
            <RevenueHPPChart data={revenueData} />
          </div>
          <div className="lg:col-span-1 flex">
            <DonutChart 
              title="Komposisi Aset"
              data={komposisiAset} 
              centerLabel={formatRupiah(totalAset, true)}
            />
          </div>
          <div className="lg:col-span-2 flex">
            <CashFlowChart data={cashFlow} />
          </div>
          <div className="lg:col-span-1 flex">
            <NeracaChart data={neracaData} />
          </div>
        </div>
      </div>
    </div>
  );
}
