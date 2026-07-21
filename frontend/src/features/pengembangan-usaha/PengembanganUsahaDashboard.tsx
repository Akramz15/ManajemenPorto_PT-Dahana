import { useState, useEffect } from "react";
import { KurvaSManager } from "@/components/charts";
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
  X,
} from "lucide-react";

export default function PengembanganUsahaDashboard() {
  const [semuaProyek, setSemuaProyek] = useState<Project[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [activePipelineTab, setActivePipelineTab] = useState<
    "kajian" | "berjalan"
  >("kajian");

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [onTrackPercent, setOnTrackPercent] = useState(0);
  const [totalDelay, setTotalDelay] = useState(0);

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
        .from("project_monthly_progress")
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
        ...(projMonthlyData || []).map((t: any) => ({ ...t, type: "monthly" })),
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
    };

    fetchDashboardData();
  }, []);

  const proyekBerjalan = semuaProyek.filter((p) => p.kategori === "berjalan");
  const proyekKajian = semuaProyek.filter((p) => p.kategori === "kajian");

  const totalAktif = proyekBerjalan.length;
  const totalKajian = proyekKajian.length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 h-125 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div
                  className={`w-2 h-6 rounded-full transition-colors ${activePipelineTab === "kajian" ? "bg-amber-500" : "bg-primary-500"}`}
                ></div>
                Pipeline Proyek{" "}
                {activePipelineTab === "kajian" ? "Kajian" : "Berjalan"}
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setActivePipelineTab("kajian")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activePipelineTab === "kajian" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Kajian
                </button>
                <button
                  onClick={() => setActivePipelineTab("berjalan")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activePipelineTab === "berjalan" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Berjalan
                </button>
              </div>
            </div>

            <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">
                      Divisi
                    </th>
                    <th className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">
                      Nama Proyek / Kajian
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 divide-y divide-slate-100">
                  {(activePipelineTab === "kajian"
                    ? proyekKajian
                    : proyekBerjalan
                  )
                    .map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProject(p)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-4 w-32">
                          <span
                            className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.divisi === "komersial" ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-600"}`}
                          >
                            {p.divisi}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {p.nama_proyek}
                        </td>
                      </tr>
                    ))}
                  {(activePipelineTab === "kajian"
                    ? proyekKajian
                    : proyekBerjalan
                  ).length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-12 text-center text-slate-400 font-medium"
                      >
                        Belum ada proyek {activePipelineTab}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card relative overflow-hidden flex flex-col border-t-4 border-t-primary-500 bg-white rounded-2xl shadow-sm border-slate-200/60 p-6 h-125">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl"></div>

            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2 relative z-10 shrink-0">
              <Activity className="text-primary-600" />
              Aktivitas Terbaru
            </h3>

            <div className="flex-1 relative overflow-y-auto pr-2 custom-scrollbar z-10">
              <div className="absolute left-3.75 top-2 bottom-2 w-px bg-slate-200"></div>

              <div className="space-y-6">
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

                    let iconColor = "bg-slate-500";
                    if (isProgress) iconColor = "bg-primary-500";
                    if (isKajian) iconColor = "bg-amber-500";
                    if (isMonthly) iconColor = "bg-purple-500";
                    if (isProject) iconColor = "bg-emerald-500";

                    const userName =
                      update.user_profiles?.display_name || "Anggota Tim";
                    const projectName =
                      update.projects?.nama_proyek || update.nama_proyek || "Proyek Dihapus";
                    
                    let actionText = "";
                    if (isProgress) {
                      actionText = `Memperbarui status task "${update.title}" menjadi ${update.status}`;
                    } else if (isKajian) {
                      actionText = `Memperbarui tahapan "${update.nama_kajian || update.tahapan}" menjadi ${update.status}`;
                    } else if (isMonthly) {
                      actionText = `Memperbarui laporan progress bulanan (${update.progress}%)`;
                    } else if (isProject) {
                      actionText = `Menambahkan proyek baru: ${projectName}`;
                    }

                    return (
                      <div
                        key={`${update.id}-${idx}`}
                        className="relative pl-10"
                      >
                        <div
                          className={`absolute left-0 top-1 w-8 h-8 rounded-full ${iconColor} flex items-center justify-center ring-4 ring-white text-white text-[10px] font-bold`}
                        >
                          {userName.charAt(0).toUpperCase()}
                        </div>

                        <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 hover:bg-white transition-colors shadow-sm">
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-2 font-medium">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(update.updated_at), {
                              locale: id,
                              addSuffix: true,
                            })}
                          </p>
                          <p className="text-sm text-slate-600 mb-2 leading-relaxed font-medium">
                            <span className="font-bold text-slate-900">
                              {userName}
                            </span>{" "}
                            {actionText}
                          </p>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 shadow-sm">
                            <FolderOpen size={10} />
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

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          ></div>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col h-[80vh]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-bl-[150px] -z-10 opacity-50"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {selectedProject.nama_proyek}
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  Kurva S Progress Aktual vs Rencana
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-negative-100 hover:text-negative-600 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col min-h-0 relative overflow-y-auto">
              <KurvaSManager projectId={selectedProject.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
