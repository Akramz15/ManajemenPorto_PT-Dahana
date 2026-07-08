import { useState } from "react";
import { KurvaSChart } from "@/components/charts";
import { ExcelUploader } from "@/components/shared";
import { useChartData } from "@/hooks/useChartData";
import { TrendingUp, ArrowUpRight } from "lucide-react";

export default function ManajemenPortoDashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch Global Chart Data (tetap menggunakan context pengembangan-usaha jika data di DB tersimpan begitu, 
  // atau ubah ke portofolio. Kita pertahankan 'pengembangan-usaha' agar data lama tidak hilang)
  const { data: chartDataPU, loading: chartLoadingPU, refetch: refetchPU } = useChartData<any>("laba-rugi", "pengembangan-usaha");
  const kurvaSDataPU = chartDataPU?.data_points || [];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header Utama */}
      <div className="page-header mb-4">
        <div className="flex items-center text-sm font-medium text-slate-500">
          <span>Manajemen Portofolio</span>
          <span className="mx-2">›</span>
          <span className="text-primary-600 font-bold">Dashboard Utama</span>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Portofolio</h1>
          <p className="text-slate-500 mt-1">Ringkasan performa finansial dan portofolio perusahaan.</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="mb-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Grafik Global Kurva S (Full Width) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 relative overflow-hidden h-[500px] w-full flex flex-col">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-50 rounded-bl-[100px] -z-10 opacity-50"></div>
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
              Laba/Rugi Pengembangan Usaha (YTD)
            </h3>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-bold text-sm hover:bg-primary-100 hover:text-primary-700 transition-colors border border-primary-100"
            >
              <ArrowUpRight size={16} />
              Update Data
            </button>
          </div>

          <div className="relative overflow-visible flex-1">
            {chartLoadingPU ? (
              <div className="h-full flex items-center justify-center rounded-2xl">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="h-full relative">
                <KurvaSChart data={kurvaSDataPU} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal (Moved from PU Dashboard) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-50 to-primary-100/50 -z-10"></div>
            
            <div className="p-8">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary-600 mb-6">
                <TrendingUp size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Data Laba/Rugi</h3>
              <p className="text-sm text-slate-500 mb-6">Unggah file Excel Laba/Rugi untuk memperbarui grafik global Divisi Pengembangan Usaha.</p>
              
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
                <ExcelUploader 
                  context="laba-rugi"
                  subContext="pengembangan-usaha"
                  onSuccess={() => {
                    refetchPU();
                    setShowUploadModal(false);
                  }}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
