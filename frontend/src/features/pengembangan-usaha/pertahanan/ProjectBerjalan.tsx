import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  ProjectManager,
  ProjectDocumentsTable,
  MonthlyProgressTracker,
} from "@/components/shared";
import { SCurveProgressChart } from "@/components/charts";
import { useDialogStore } from "@/store/dialogStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Settings,
  Search,
  User,
  Clock,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { Project } from "@/types";

export default function ProjectBerjalan() {
  const { session: _session } = useAuth();
  const { confirm, alert } = useDialogStore();
  // States
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProject = searchParams.get("project") || "";

  const setSelectedProject = useCallback((id: string) => {
    if (id) {
      setSearchParams({ project: id });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch all berjalan projects for pertahanan
    const fetchAllProjects = async () => {
      // Adding join to user_profiles if it exists, otherwise it will just gracefully fail or ignore
      const { data, error } = await supabase
        .from("projects")
        .select(`*, user_profiles(display_name)`)
        .eq("divisi", "pertahanan")
        .eq("kategori", "berjalan")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setAllProjects(data as any[]);
      } else {
        // Fallback if relation doesn't exist
        const fallback = await supabase
          .from("projects")
          .select("*")
          .eq("divisi", "pertahanan")
          .eq("kategori", "berjalan")
          .order("created_at", { ascending: false });
        const projectsData = fallback.data || [];
        const userIds = [
          ...new Set(projectsData.map((p) => p.created_by).filter(Boolean)),
        ];

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, display_name")
            .in("id", userIds);

          if (profiles && profiles.length > 0) {
            const profileMap = Object.fromEntries(
              profiles.map((p) => [p.id, p]),
            );
            projectsData.forEach((p) => {
              if (p.created_by && profileMap[p.created_by]) {
                (p as any).user_profiles = profileMap[p.created_by];
              }
            });
          }
        }

        setAllProjects(projectsData as Project[]);
      }
    };
    fetchAllProjects();
  }, [showManager]);

  useEffect(() => {
    if (selectedProject) {
      const found = allProjects.find((p) => p.id === selectedProject);
      if (found) {
        setProjectData(found);
      } else {
        supabase
          .from("projects")
          .select("*")
          .eq("id", selectedProject)
          .single()
          .then(({ data }) => {
            setProjectData(data as Project);
          });
      }
    } else {
      setProjectData(null);
    }
  }, [selectedProject, allProjects]);

  // Dynamic S-Curve based on project_progress_activities
  const [sCurveData, setSCurveData] = useState<any[]>([]);

  const fetchDynamicSCurve = useCallback(async () => {
    if (!selectedProject || !projectData) return;

    const { data: progressData } = await supabase
      .from("project_progress_activities")
      .select("*")
      .eq("project_id", selectedProject)
      .order("year", { ascending: true })
      .order("month", { ascending: true });

    const start = projectData.start_date
      ? new Date(projectData.start_date)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = projectData.end_date
      ? new Date(projectData.end_date)
      : new Date(new Date().getFullYear(), 11, 31);

    const totalMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1;
    if (totalMonths <= 0) {
      setSCurveData([]);
      return;
    }

    const step = 100 / totalMonths;
    const curve: any[] = [];
    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    let currentRealisasi = 0;
    let expectedAccum = 0;

    const today = new Date();
    const hasAnyActivity = progressData && progressData.length > 0;

    for (let i = 0; i < totalMonths; i++) {
      const currentMonthIndex = start.getMonth() + i;
      const m = (currentMonthIndex % 12) + 1;
      const y = start.getFullYear() + Math.floor(currentMonthIndex / 12);

      expectedAccum += step;
      if (expectedAccum > 100) expectedAccum = 100;

      // Filter activities for this exact month
      const monthActivities = progressData?.filter((p) => p.month === m && p.year === y) || [];
      const monthWeight = monthActivities.reduce((acc, curr) => acc + Number(curr.weight_percentage), 0);
      
      currentRealisasi += monthWeight;
      if (currentRealisasi > 100) currentRealisasi = 100;

      const isPastOrCurrent =
        y < today.getFullYear() ||
        (y === today.getFullYear() && m <= today.getMonth() + 1);

      // Only plot realisasi if there is at least one activity in the project and it's past/current
      const plotRealisasi = hasAnyActivity && (isPastOrCurrent || monthActivities.length > 0);

      curve.push({
        periode: `${MONTHS[m - 1]} ${y}`,
        rencana: parseFloat(expectedAccum.toFixed(1)),
        realisasi: plotRealisasi ? parseFloat(currentRealisasi.toFixed(1)) : null,
        activities: monthActivities, // Pass activities to tooltip
      });
    }

    setSCurveData(curve);
  }, [selectedProject, projectData]);

  useEffect(() => {
    fetchDynamicSCurve();
  }, [fetchDynamicSCurve]);
  const handleDeleteProject = async (projectId: string) => {
    if (
      !(await confirm(
        "Apakah Anda yakin ingin menghapus proyek ini? Seluruh data dan task akan ikut terhapus secara permanen.",
        { severity: "danger" },
      ))
    )
      return;
    try {
      await supabase.from("projects").delete().eq("id", projectId);
      setSelectedProject("");
      window.location.reload();
    } catch (e) {
      console.error("Failed to delete project", e);
      alert("Gagal menghapus proyek.", { severity: "danger" });
    }
  };

  const filteredProjects = allProjects.filter((p) =>
    p.nama_proyek.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="px-6 pt-0 pb-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Breadcrumbs & Header */}
      {selectedProject && (
        <button
          onClick={() => setSelectedProject("")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:text-primary-700 hover:border-primary-300 hover:bg-primary-50 shadow-sm rounded-xl transition-all w-fit"
        >
          Kembali ke Workspace
        </button>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <div className="flex items-center text-sm font-medium text-slate-500 mb-4">
          <span>Pengembangan Usaha</span>
          <span className="mx-2">›</span>
          <span>Pertahanan</span>
          <span className="mx-2">›</span>
          <span className="text-primary-600 font-bold">Project Berjalan</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {selectedProject
                ? projectData?.nama_proyek
                : "Workspace: Project Berjalan"}
            </h1>
            {!selectedProject && (
              <p className="text-slate-500 mt-1">
                Kelola dan pantau seluruh proyek berjalan divisi pertahanan
                secara kolaboratif.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedProject ? (
              <>
                <button
                  onClick={() => setShowManager(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-0.5"
                >
                  <Settings size={18} />
                  Edit Project
                </button>
                <button
                  onClick={() => handleDeleteProject(selectedProject)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 hover:text-red-700 transition-all shadow-sm border border-red-100"
                >
                  <Trash2 size={18} />
                  Hapus
                </button>
              </>
            ) : allProjects.length > 0 ? (
              <button
                onClick={() => setShowManager(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5"
              >
                <Plus size={18} />
                Tambah Project Baru
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {showManager && createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            <button
              onClick={() => setShowManager(false)}
              className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200 rounded-full transition-colors"
            >
              ✕
            </button>
            <div className="overflow-y-auto custom-scrollbar p-6 sm:p-8">
              <ProjectManager
                divisi="pertahanan"
                kategori="berjalan"
                selectedProjectId={selectedProject}
                onProjectSelected={(id) => {
                  setSelectedProject(id);
                  setShowManager(false);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Content */}
      {selectedProject ? (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col justify-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={12} /> Ditambahkan Oleh
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {/* @ts-ignore */}
                {projectData?.user_profiles?.display_name ||
                  "Pengguna (Tidak Diketahui)"}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col justify-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock size={12} /> Dibuat Pada
              </p>
              <p className="text-sm font-bold text-slate-800">
                {projectData?.created_at
                  ? new Date(projectData.created_at).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : "-"}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col justify-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                Tanggal Mulai
              </p>
              <p className="text-sm font-bold text-slate-800">
                {projectData?.start_date
                  ? new Date(projectData.start_date).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : "Tidak diatur"}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col justify-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                Tanggal Selesai
              </p>
              <p className="text-sm font-bold text-slate-800">
                {projectData?.end_date
                  ? new Date(projectData.end_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Tidak diatur"}
              </p>
            </div>
          </div>

          {/* S-Curve Chart (Full Width) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 relative h-125 flex flex-col">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-100 rounded-full -z-10 blur-3xl opacity-50"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary-100 rounded-full -z-10 blur-3xl opacity-50"></div>
            <SCurveProgressChart data={sCurveData} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Progress Tracker */}
            {projectData && (
              <MonthlyProgressTracker
                project={projectData}
                onUpdate={fetchDynamicSCurve}
              />
            )}

            {/* Project Documents */}
            <ProjectDocumentsTable projectId={selectedProject} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Header Workspace */}
          <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-primary-500" /> Semua Proyek Berjalan
              <span className="bg-primary-100 text-primary-700 text-xs py-0.5 px-2.5 rounded-full">
                {filteredProjects.length}
              </span>
            </h3>

            <div className="relative max-w-sm w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari nama proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
              />
            </div>
          </div>

          <div className="p-6 flex-1 bg-slate-50/30 overflow-y-auto custom-scrollbar">
            {allProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
                  <ShieldAlert className="w-10 h-10 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-700 mb-2">
                  Workspace Kosong
                </h4>
                <p className="text-sm font-medium text-center max-w-sm">
                  Belum ada proyek berjalan di divisi pertahanan. Semua anggota
                  tim dapat menambahkan proyek baru ke dalam workspace ini.
                </p>
                <button
                  onClick={() => setShowManager(true)}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary-600 text-white shadow-lg shadow-primary-500/30 rounded-xl text-sm font-bold hover:bg-primary-700 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={18} /> Buat Proyek Pertama
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                <p>Tidak ada proyek yang sesuai dengan pencarian Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className="group relative flex flex-col p-5 bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-300 shrink-0 border border-slate-100/80">
                        <ShieldAlert size={18} strokeWidth={2.5} />
                      </div>
                      <h4 className="text-[15px] font-semibold tracking-tight text-slate-900 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors pt-1">
                        {project.nama_proyek}
                      </h4>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100/60 pt-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-slate-200/80 shadow-sm">
                          {/* @ts-ignore */}
                          {project.user_profiles?.display_name
                            ? project.user_profiles.display_name
                                .charAt(0)
                                .toUpperCase()
                            : "T"}
                        </div>
                        <span className="text-xs font-medium text-slate-500 truncate max-w-24">
                          {/* @ts-ignore */}
                          {project.user_profiles?.display_name ||
                            "Tim Pertahanan"}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300 flex items-center gap-1">
                        Masuk Board &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
