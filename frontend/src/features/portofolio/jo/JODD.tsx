import { useChartData } from "@/hooks/useChartData";
import { InventoriChart, DonutChart, EkuitasChart } from "@/components/charts";
import { ExcelUploader, PortfolioDriveLinks } from "@/components/shared";
import { formatUSD } from "@/lib/formatters";

export default function JODD() {
  const { data: chartData, loading, refetch } = useChartData<any>("jodd");

  const inv200 = chartData?.data?.inventori_200gr || [];
  const inv400 = chartData?.data?.inventori_400gr || [];
  
  const ytdLabaRugi = chartData?.data?.ytd_laba_rugi || {};
  const ytdCashflow = chartData?.data?.ytd_cashflow || {};
  const komposisiAset = chartData?.data?.komposisi_aset || [];
  const ekuitasDetail = chartData?.data?.ekuitas_detail || {
    modal_saham: 0,
    disagio_saham: 0,
    tambahan_modal: 0,
    saldo_laba: 0,
  };

  const totalAset = komposisiAset.reduce((acc: number, d: any) => acc + d.value, 0);
  const totalPenjualan = ytdLabaRugi.penjualan || 0;
  const totalHpp = ytdLabaRugi.hpp || 0;
  const hppPercentage = totalPenjualan > 0 ? (totalHpp / totalPenjualan) * 100 : 0;

  return (
    <div className="px-6 pt-0 pb-6 max-w-[1600px] mx-auto flex flex-col gap-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 card p-6! border-0! bg-white/80! shadow-sm!">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Joint Operation Dahana - Dayaprime (JODD)
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Dashboard finansial dan mutasi inventori Dayaprime
          </p>
        </div>

        <div className="w-full md:w-auto flex items-center justify-end gap-3 shrink-0">
          <PortfolioDriveLinks context="jodd" />
          <div className="w-full md:w-64">
            <ExcelUploader
              context="jodd"
              compact={true}
              onSuccess={() => refetch()}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-100">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Laba Rugi Summary Card */}
          <div className="card w-full border-0 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 p-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-900">Ringkasan Laba Rugi</h3>
                  <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wider border border-primary-100">
                    {ytdLabaRugi.periode || "YTD"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Penjualan</p>
                    <p className="text-xl font-black text-slate-900">{formatUSD(totalPenjualan)}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">Laba Bersih</p>
                    <p className="text-xl font-black text-emerald-700">{formatUSD(ytdLabaRugi.laba_bersih || 0)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Proporsi HPP</span>
                    <span className="text-rose-600">{formatUSD(totalHpp)} ({hppPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(hppPercentage, 100)}%` }} />
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(100 - hppPercentage, 0)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>HPP</span>
                    <span>Margin Laba Kotor</span>
                  </div>
                </div>
              </div>
              
              <div className="w-px bg-slate-100 hidden md:block" />

              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-900">Arus Kas (Cash Flow)</h3>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200">
                    {ytdCashflow.periode || "YTD"}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Aktivitas Operasi (CFO)</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatUSD(ytdCashflow.cfo || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-sm font-semibold text-slate-700">Aktivitas Investasi (CFI)</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatUSD(ytdCashflow.cfi || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm font-semibold text-slate-700">Aktivitas Pendanaan (CFF)</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatUSD(ytdCashflow.cff || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white shadow-md">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-300">Saldo Akhir</span>
                    <span className="text-lg font-black text-white">{formatUSD(ytdCashflow.saldo_akhir || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <DonutChart
                title="Komposisi Aset"
                data={komposisiAset}
                centerLabel={formatUSD(totalAset, true)}
                formatValue={formatUSD}
              />
            </div>
            <div className="lg:col-span-2">
              <EkuitasChart 
                data={ekuitasDetail} 
                formatValue={formatUSD}
              />
            </div>
          </div>

          <InventoriChart
            title="Inventori Dayaprime 200gr"
            subtitle="Mutasi stok gudang per bulan"
            data={inv200}
          />
          <InventoriChart
            title="Inventori Dayaprime 400gr"
            subtitle="Mutasi stok gudang per bulan"
            data={inv400}
          />
        </div>
      )}
    </div>
  );
}
