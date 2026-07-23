import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  Activity,
  ChevronRight,
} from "lucide-react";

const getUserColor = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function PengembanganUsahaDashboard() {
  const [semuaProyek, setSemuaProyek] = useState<Project[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [activePipelineTab, setActivePipelineTab] = useState<
    "kajian" | "berjalan"
  >("kajian");

  const navigate = useNavigate();

  const [onTrackPercent, setOnTrackPercent] = useState(0);
  const [totalDelay, setTotalDelay] = useState(0);
  const [projectProgressMap, setProjectProgressMap] = useState<Record<string, string | number>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsData) {
        setSemuaProyek(projectsData as Project[]);
      }

      const { data: progressData, error: err1 } = await supabase
        .from("progress_tasks")
        .select(`*, projects(nama_proyek)`)
        .order("updated_at", { ascending: false })
        .limit(10);

      const { data: kajianData, error: err2 } = await supabase
        .from("kajian_tasks")
        .select(`*, projects(nama_proyek)`)
        .order("updated_at", { ascending: false })
        .limit(10);

      const { data: projMonthlyData, error: err3 } = await supabase
        .from("project_progress_activities")
        .select(`*, projects(nama_proyek)`)
        .order("updated_at", { ascending: false })
        .limit(10);

      const { data: projectsData2, error: err4 } = await supabase
        .from("projects")
        .select(`id, nama_proyek, created_by, created_at, updated_at`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (err1) console.error("progress error", err1);
      if (err2) console.error("kajian error", err2);
      if (err3) console.error("monthly error", err3);
      if (err4) console.error("projects error", err4);

      const combined = [
        ...(progressData || []).map((t: any) => ({ ...t, type: "progress" })),
        ...(kajianData || []).map((t: any) => ({ ...t, type: "kajian" })),
        ...(projMonthlyData || []).map((t: any) => ({ ...t, type: "monthly", assigned_to: t.created_by })),
        ...(projectsData2 || []).map((t: any) => ({ 
          ...t, 
          type: "project", 
          assigned_to: t.created_by,
          updated_at: t.created_at // Use created_at for new projects
        })),
      ];

      // Ambil user profiles secara manual karena relasi auth.users gagal di-query
      const userIds = [...new Set(combined.map(t => t.assigned_to).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", userIds);
          
        if (profiles) {
          const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          combined.forEach(t => {
            if (t.assigned_to && profileMap[t.assigned_to]) {
              t.user_profiles = profileMap[t.assigned_to];
            }
          });
        }
      }

      const blockedProjectIds = new Set<string>();
      combined.forEach((task) => {
        if (task.project_id && task.status === "blocked") {
          blockedProjectIds.add(task.project_id);
        }
      });

      const totalProjects = projectsData ? projectsData.length : 0;
      const delayCount = blockedProjectIds.size;
      const amanCount = totalProjects - delayCount;
      const percent =
        totalProjects === 0 ? 0 : Math.round((amanCount / totalProjects) * 100);

      setTotalDelay(delayCount);
      setOnTrackPercent(percent);

      combined.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      setRecentUpdates(combined.slice(0, 15));

      const { data: ppaData } = await supabase
        .from("project_progress_activities")
        .select("project_id, weight_percentage");

      const progressMap: Record<string, string | number> = {};
      ppaData?.forEach((row) => {
        const existing = (progressMap[row.project_id] as number) || 0;
        const newTotal = existing + Number(row.weight_percentage || 0);
        // round to 1 decimal to avoid float precision issues
        progressMap[row.project_id] = parseFloat(newTotal.toFixed(1));
      });
      
      const { data: kajianTahapan } = await supabase
        .from("kajian_tasks")
        .select("project_id, tahapan")
        .order("updated_at", { ascending: true });
        
      kajianTahapan?.forEach((row) => {
        if (row.tahapan) progressMap[row.project_id] = row.tahapan;
      });
      
      setProjectProgressMap(progressMap);
    };

    fetchDashboardData();
  }, []);

  const proyekBerjalan = semuaProyek.filter((p) => p.kategori === "berjalan");
  const proyekKajian = semuaProyek.filter((p) => p.kategori === "kajian");

  const totalAktif = proyekBerjalan.length;
  const totalKajian = proyekKajian.length;

  return (
    <div className="p-6 pt-0 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      <div className="page-header mb-4">
        <div className="flex items-center text-sm font-medium text-slate-500">
          <span>Pengembangan Usaha</span>
          <span className="mx-2">›</span>
          <span className="text-primary-600 font-bold">Dashboard Utama</span>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Ringkasan performa dan portofolio seluruh divisi Pengembangan Usaha.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-primary-200 transition-colors">
          <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
              Proyek Berjalan
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {totalAktif}{" "}
              <span className="text-sm text-slate-400 font-medium normal-case">
                Proyek Aktif
              </span>
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-amber-200 transition-colors">
          <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <FolderOpen size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
              Pipeline Kajian
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {totalKajian}{" "}
              <span className="text-sm text-slate-400 font-medium normal-case">
                Proyek Proposal
              </span>
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-positive-200 transition-colors">
          <div className="w-14 h-14 bg-positive-50 rounded-xl flex items-center justify-center text-positive-600 group-hover:bg-positive-500 group-hover:text-white transition-colors">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
              Status On-Track
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {onTrackPercent}
              <span className="text-2xl">%</span>{" "}
              <span className="text-sm text-slate-400 font-medium normal-case">
                Proyek Aman
              </span>
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 group hover:border-negative-200 transition-colors">
          <div className="w-14 h-14 bg-negative-50 rounded-xl flex items-center justify-center text-negative-600 group-hover:bg-negative-500 group-hover:text-white transition-colors">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
              Delay / Risk
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {totalDelay}{" "}
              <span className="text-sm text-slate-400 font-medium normal-case">
                Perlu Perhatian
              </span>
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 h-[600px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 shrink-0 border-b border-slate-100/80 pb-6">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <FolderOpen size={20} strokeWidth={2.5} />
                </span>
                Pipeline Proyek
              </h3>
              <div className="flex bg-slate-100/80 p-1 rounded-full w-fit">
                <button
                  onClick={() => setActivePipelineTab("kajian")}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activePipelineTab === "kajian" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Kajian
                </button>
                <button
                  onClick={() => setActivePipelineTab("berjalan")}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activePipelineTab === "berjalan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Berjalan
                </button>
              </div>
            </div>

            <div className="overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar pr-2">
              <div className="flex flex-col space-y-1">
                {(activePipelineTab === "kajian"
                  ? proyekKajian
                  : proyekBerjalan
                ).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pu/${p.divisi}/${activePipelineTab}?project=${p.id}`)}
                    className="group flex items-center justify-between py-4 px-4 rounded-2xl hover:bg-slate-50/80 transition-colors cursor-pointer border border-transparent hover:border-slate-100/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${activePipelineTab === "kajian" ? "bg-amber-400" : "bg-primary-400"} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base mb-0.5 group-hover:text-primary-600 transition-colors">
                          {p.nama_proyek}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            Divisi {p.divisi}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            activePipelineTab === "kajian" 
                              ? "text-amber-600 bg-amber-50" 
                              : "text-primary-600 bg-primary-50"
                          }`}>
                            {activePipelineTab === "kajian" 
                              ? (projectProgressMap[p.id] || "BELUM DIMULAI") 
                              : `PROGRESS: ${projectProgressMap[p.id] || 0}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 group-hover:text-primary-600 group-hover:border-primary-100 transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
                {(activePipelineTab === "kajian"
                  ? proyekKajian
                  : proyekBerjalan
                ).length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                      <FolderOpen size={32} />
                    </div>
                    <p className="text-slate-400 font-medium">
                      Belum ada proyek {activePipelineTab}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 h-[600px] flex flex-col relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl"></div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-8 flex items-center gap-3 border-b border-slate-100/80 pb-6 relative z-10 shrink-0">
              <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Activity size={16} />
              </span>
              Aktivitas Terbaru
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 pl-1 py-1 custom-scrollbar z-10">
              <div className="relative">
                {recentUpdates.length > 0 && (
                  <div className="absolute left-3.75 top-4 bottom-8 w-px bg-slate-200/80 z-0"></div>
                )}

                <div className="flex flex-col">
                  {recentUpdates.length === 0 ? (
                    <p className="text-slate-400 text-sm font-medium pl-10">
                      Belum ada aktivitas tercatat.
                    </p>
                  ) : (
                    recentUpdates.map((update, idx) => {
                      const isProgress = update.type === "progress";
                      const isKajian = update.type === "kajian";
                      const isMonthly = update.type === "monthly";
                      const isProject = update.type === "project";

                      const userName =
                        update.user_profiles?.display_name || "Anggota Tim";
                      const iconColor = getUserColor(userName);
                      const projectName =
                        update.projects?.nama_proyek || update.nama_proyek || "Proyek Dihapus";
                      
                      let actionText = "";
                      if (isProgress) {
                        actionText = `Memperbarui status task "${update.title}" menjadi ${update.status}`;
                      } else if (isKajian) {
                        actionText = `Memperbarui tahapan "${update.nama_kajian || update.tahapan}" menjadi ${update.status}`;
                      } else if (isMonthly) {
                        const progValue = update.weight_percentage !== undefined ? update.weight_percentage : 0;
                        actionText = `Menambahkan aktivitas: ${update.activity_name || "Progress Bulanan"} (${progValue}%)`;
                      } else if (isProject) {
                        actionText = `Menambahkan proyek baru: ${projectName}`;
                      }

                      return (
                        <div
                          key={`${update.id}-${idx}`}
                          className="relative pl-12 pb-6 last:pb-2"
                        >
                          <div
                            className={`absolute left-0 top-1 w-8 h-8 rounded-full ${iconColor} flex items-center justify-center ring-4 ring-white shadow-sm text-white text-[10px] font-bold z-10`}
                          >
                            {userName.charAt(0).toUpperCase()}
                          </div>

                          <div className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:border-slate-200 transition-all relative z-10">
                            <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(update.updated_at), {
                                locale: id,
                                addSuffix: true,
                              })}
                            </p>
                            <p className="text-sm text-slate-700 mb-3 leading-relaxed">
                              <span className="font-bold text-slate-900">
                                {userName}
                              </span>{" "}
                              {actionText}
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <FolderOpen size={12} />
                              <span className="truncate max-w-37.5">
                                {projectName}
                              </span>
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
      </div>

    </div>
  );
}
