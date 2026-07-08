import { useState, useEffect } from "react";
import { KurvaSChart } from "@/components/charts";
import { ExcelUploader } from "@/components/shared";
import { useChartData } from "@/hooks/useChartData";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, FolderOpen, Activity, ArrowUpRight } from "lucide-react";

export default function PengembanganUsahaDashboard() {
  const [semuaProyek, setSemuaProyek] = useState<Project[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activePipelineTab, setActivePipelineTab] = useState<'kajian' | 'berjalan'>('kajian');

  // KPI States
  const [onTrackPercent, setOnTrackPercent] = useState(0);
  const [totalDelay, setTotalDelay] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Fetch All Projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (projectsData) {
        setSemuaProyek(projectsData as Project[]);
      }

      // 2. Fetch Recent Updates (gabungan progress & kajian)
      // Kita fetch semua untuk mengkalkulasi KPI proyek blocked
      const { data: progressData } = await supabase
        .from("progress_tasks")
        .select(`*, projects(nama_proyek), user_profiles(display_name)`)
        .order("updated_at", { ascending: false });
        
      const { data: kajianData } = await supabase
        .from("kajian_tasks")
        .select(`*, projects(nama_proyek), user_profiles(display_name)`)
        .order("updated_at", { ascending: false });

      const combined = [
        ...(progressData || []).map((t: any) => ({ ...t, type: "progress" })),
        ...(kajianData || []).map((t: any) => ({ ...t, type: "kajian" }))
      ];

      // KPI Calculations: Cari proyek yang punya task "blocked"
      const blockedProjectIds = new Set<string>();
      combined.forEach(task => {
        if (task.project_id && task.status === "blocked") {
          blockedProjectIds.add(task.project_id);
        }
      });
      
      const totalProjects = projectsData ? projectsData.length : 0;
      const delayCount = blockedProjectIds.size;
      const amanCount = totalProjects - delayCount;
      const percent = totalProjects === 0 ? 0 : Math.round((amanCount / totalProjects) * 100);
      
      setTotalDelay(delayCount);
      setOnTrackPercent(percent);
      
      // Sort combined by updated_at descending and take top 10 for feed
      combined.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setRecentUpdates(combined.slice(0, 10));
    };
    
    fetchDashboardData();
  }, []);

  // Fetch Global PU Chart Data
  const { data: chartDataPU, loading: chartLoadingPU, refetch: refetchPU } = useChartData<any>("laba-rugi", "pengembangan-usaha");
  const kurvaSDataPU = chartDataPU?.data_points || [];

  // KPIs Calculation
  const proyekBerjalan = semuaProyek.filter(p => p.kategori === "berjalan");
  const proyekKajian = semuaProyek.filter(p => p.kategori === "kajian");
  
  // Status Kesehatan Proyek (Just as an example KPI based on recent updates or tasks)
  // Let's calculate from recent progress if they are on track or not, or just a dummy metric if we don't have project status
  // We'll calculate it by iterating through all projects (if we had a status field) or we just infer.
  // We can say: 
  const totalAktif = proyekBerjalan.length;
  const totalKajian = proyekKajian.length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header Utama */}
      <div className="page-header mb-4">
        <div className="flex items-center text-sm font-medium text-slate-500">
          <span>Pengembangan Usaha</span>
          <span className="mx-2">›</span>
          <span className="text-primary-600 font-bold">Dashboard Utama</span>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1">Ringkasan performa dan portofolio seluruh divisi Pengembangan Usaha.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-primary-200 transition-colors">
          <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Proyek Berjalan</p>
            <h3 className="text-3xl font-black text-slate-900">{totalAktif} <span className="text-sm text-slate-400 font-medium normal-case">Proyek Aktif</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-amber-200 transition-colors">
          <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <FolderOpen size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Pipeline Kajian</p>
            <h3 className="text-3xl font-black text-slate-900">{totalKajian} <span className="text-sm text-slate-400 font-medium normal-case">Proyek Proposal</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-positive-200 transition-colors">
          <div className="w-14 h-14 bg-positive-50 rounded-xl flex items-center justify-center text-positive-600 group-hover:bg-positive-500 group-hover:text-white transition-colors">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Status On-Track</p>
            <h3 className="text-3xl font-black text-slate-900">{onTrackPercent}<span className="text-2xl">%</span> <span className="text-sm text-slate-400 font-medium normal-case">Proyek Aman</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-negative-200 transition-colors">
          <div className="w-14 h-14 bg-negative-50 rounded-xl flex items-center justify-center text-negative-600 group-hover:bg-negative-500 group-hover:text-white transition-colors">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Delay / Risk</p>
            <h3 className="text-3xl font-black text-slate-900">{totalDelay} <span className="text-sm text-slate-400 font-medium normal-case">Perlu Perhatian</span></h3>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="mb-6 space-y-6">
        {/* Grafik Global Kurva S (Full Width) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 relative overflow-hidden">
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

          <div className="relative overflow-visible min-h-[460px]">
            {chartLoadingPU ? (
              <div className="h-[460px] flex items-center justify-center rounded-2xl">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="h-[460px] relative">
                <KurvaSChart data={kurvaSDataPU} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Tabel Kajian */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tabel Proyek Pipeline */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className={`w-2 h-6 rounded-full transition-colors ${activePipelineTab === 'kajian' ? 'bg-amber-500' : 'bg-primary-500'}`}></div>
                Pipeline Proyek {activePipelineTab === 'kajian' ? 'Kajian' : 'Berjalan'}
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button 
                  onClick={() => setActivePipelineTab('kajian')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activePipelineTab === 'kajian' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Kajian
                </button>
                <button 
                  onClick={() => setActivePipelineTab('berjalan')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activePipelineTab === 'berjalan' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Berjalan
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Divisi</th>
                    <th className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Nama Proyek / Kajian</th>
                    <th className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Mitra</th>
                    <th className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Nilai Kontrak</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 divide-y divide-slate-100">
                  {(activePipelineTab === 'kajian' ? proyekKajian : proyekBerjalan).slice(0, 10).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.divisi === 'komersial' ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-600'}`}>
                          {p.divisi}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 max-w-xs truncate">{p.nama_proyek}</td>
                      <td className="py-4 px-4 text-slate-500">{p.mitra || "-"}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-slate-900">
                          {p.nilai_kontrak ? `Rp ${p.nilai_kontrak.toLocaleString('id-ID')}` : 'Belum Ditentukan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(activePipelineTab === 'kajian' ? proyekKajian : proyekBerjalan).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">Belum ada proyek {activePipelineTab}.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(activePipelineTab === 'kajian' ? proyekKajian : proyekBerjalan).length > 10 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-primary-600 font-bold hover:underline cursor-pointer">Lihat semua proyek {activePipelineTab}</span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Aktivitas Terbaru */}
        <div className="space-y-6">
          <div className="card relative overflow-hidden h-[calc(100%-1.5rem)] flex flex-col border-t-4 border-t-primary-500">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl"></div>
            
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2 relative z-10">
              <Activity className="text-primary-600" />
              Aktivitas Terbaru
            </h3>

            <div className="flex-1 relative overflow-y-auto pr-2 custom-scrollbar z-10">
              <div className="absolute left-3.75 top-2 bottom-2 w-px bg-slate-200"></div>
              
              <div className="space-y-6">
                {recentUpdates.length === 0 ? (
                  <p className="text-slate-400 text-sm font-medium pl-10">Belum ada aktivitas tercatat.</p>
                ) : (
                  recentUpdates.map((update, idx) => {
                    const isProgress = update.type === "progress";
                    const iconColor = isProgress ? "bg-primary-500" : "bg-amber-500";
                    const userName = update.user_profiles?.display_name || "Anggota Tim";
                    const projectName = update.projects?.nama_proyek || "Proyek Dihapus";
                    const actionText = isProgress 
                      ? `Memperbarui status task "${update.title}" menjadi ${update.status}` 
                      : `Memperbarui tahapan "${update.nama_kajian || update.tahapan}" menjadi ${update.status}`;
                    
                    return (
                      <div key={`${update.id}-${idx}`} className="relative pl-10">
                        <div className={`absolute left-0 top-1 w-8 h-8 rounded-full ${iconColor} flex items-center justify-center ring-4 ring-white text-white text-[10px] font-bold`}>
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 hover:bg-white transition-colors shadow-sm">
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-2 font-medium">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(update.updated_at), { locale: id, addSuffix: true })}
                          </p>
                          <p className="text-sm text-slate-600 mb-2 leading-relaxed font-medium">
                            <span className="font-bold text-slate-900">{userName}</span> {actionText}
                          </p>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 shadow-sm">
                            <FolderOpen size={10} />
                            <span className="truncate max-w-37.5">{projectName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowUploadModal(false)} 
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Data Laba/Rugi</h3>
            <p className="text-sm text-slate-500 mb-6">Unggah file Excel Laba/Rugi untuk memperbarui grafik global Divisi Pengembangan Usaha.</p>
            <ExcelUploader 
              context="laba-rugi" 
              subContext="pengembangan-usaha"
              onSuccess={() => {
                refetchPU();
                setShowUploadModal(false);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
