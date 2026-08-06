import { useState, useCallback, useEffect, useMemo } from "react";
import { Building2, Calendar, X, FolderOpen, Search, User, Clock, Trash2, Settings, Edit3, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { SCurveProgressChart } from "@/components/charts";
import { MonthlyProgressTracker, ProjectDocumentsTable, ProjectManager } from "@/components/shared";
import { Spinner } from "@/components/ui";
import { useDialogStore } from "@/store/dialogStore";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/types/api.types";

export default function PortofolioLainnya() {
  const { alert } = useDialogStore();
  const { user } = useAuth();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get("project") || "";

  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [periodData, setPeriodData] = useState({ start_date: "", end_date: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [projectData, setProjectData] = useState<Project | null>(null);

  // States for list view
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAllProjects = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select(`*, user_profiles(display_name)`)
      .eq("divisi", "lainnya")
      .order("created_at", { ascending: false });
    setAllProjects((data as any[]) || []);
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      fetchAllProjects();
    }
  }, [selectedProjectId, fetchAllProjects, showManager]);

  const setSelectedProjectId = (id: string) => {
    if (id) {
      setSearchParams({ project: id });
    } else {
      setSearchParams({});
    }
  };

  const fetchProject = useCallback(async () => {
    if (!selectedProjectId) {
      setProjectData(null);
      return;
    }
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", selectedProjectId)
      .single();
    
    if (data) {
      setProjectData(data as Project);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const [progressData, setProgressData] = useState<any[]>([]);

  const fetchProgressData = useCallback(async () => {
    if (!selectedProjectId) {
      setProgressData([]);
      return;
    }
    const { data } = await supabase
      .from("project_progress_activities")
      .select("*")
      .eq("project_id", selectedProjectId)
      .order("year", { ascending: true })
      .order("month", { ascending: true });
    setProgressData(data || []);
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  const sCurveData = useMemo(() => {
    if (!projectData) return [];

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

    if (totalMonths <= 0) return [];

    const step = 100 / totalMonths;
    const curve: any[] = [];

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

      const monthActivities =
        progressData?.filter((p) => p.month === m && p.year === y) || [];
      const monthWeight = monthActivities.reduce(
        (acc, curr) => acc + Number(curr.weight_percentage),
        0,
      );

      currentRealisasi += monthWeight;
      if (currentRealisasi > 100) currentRealisasi = 100;

      const isPastOrCurrent =
        y < today.getFullYear() ||
        (y === today.getFullYear() && m <= today.getMonth() + 1);

      const plotRealisasi = hasAnyActivity && (isPastOrCurrent || monthActivities.length > 0);

      curve.push({
        name: `${m}/${y.toString().slice(2)}`,
        rencana: parseFloat(expectedAccum.toFixed(1)),
        realisasi: plotRealisasi
          ? parseFloat(currentRealisasi.toFixed(1))
          : null,
      });
    }

    return curve;
  }, [projectData, progressData]);

  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          start_date: periodData.start_date,
          end_date: periodData.end_date,
        })
        .eq("id", selectedProjectId);

      if (error) throw error;
      alert("Periode pelaksanaan berhasil diperbarui!", {
        severity: "success",
      });
      setIsUpdateProgressOpen(false);
      fetchProject();
    } catch (err) {
      alert("Gagal memperbarui periode pelaksanaan", { severity: "danger" });
    }
    setIsSaving(false);
  };

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
      setSelectedProjectId("");
      fetchAllProjects();
    } catch (e) {
      alert("Gagal menghapus proyek.", { severity: "danger" });
    }
  };

  const filteredProjects = allProjects.filter((p) =>
    p.nama_proyek.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!selectedProjectId) {
    return (
      <div className={`flex flex-col overflow-x-hidden h-full overflow-hidden`}>
        <div className={`px-6 pt-0 max-w-[1600px] mx-auto w-full flex flex-col gap-6 h-full pb-0`}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center text-sm font-medium text-slate-500 mb-4">
              <span>Portofolio</span>
              <span className="mx-2">›</span>
              <span className="text-primary-600 font-bold">Portofolio Lainnya</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Workspace: Portofolio Lainnya
                </h1>
                <p className="text-slate-500 mt-1">
                  Kelola proyek-proyek khusus lainnya selain Komersial dan Pertahanan.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowManager(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5"
                >
                  <Plus size={18} />
                  Tambah Project Baru
                </button>
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
                    divisi="lainnya"
                    kategori="lainnya"
                    selectedProjectId={selectedProjectId}
                    onProjectSelected={(id) => {
                      setSelectedProjectId(id);
                      setShowManager(false);
                    }}
                  />
                </div>
              </div>
            </div>,
            document.body
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FolderOpen className="text-primary-500" /> Semua Proyek Lainnya
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
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="p-6 flex-1 bg-slate-50/30 overflow-y-auto custom-scrollbar">
              {allProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                  <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
                    <FolderOpen className="w-10 h-10 text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-700 mb-2">
                    Workspace Kosong
                  </h4>
                  <p className="text-sm font-medium text-center max-w-sm">
                    Belum ada portofolio lainnya. Silakan tambahkan proyek baru.
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
                  {filteredProjects.map((project: any) => (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className="group relative flex flex-col p-6 bg-white rounded-3xl hover:bg-slate-50/50 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-slate-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-300 shrink-0 border border-slate-100/80">
                          <FolderOpen size={18} strokeWidth={2.5} />
                        </div>
                        <h4 className="text-[15px] font-semibold tracking-tight text-slate-900 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors pt-1">
                          {project.nama_proyek}
                        </h4>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100/60 pt-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-slate-200/80 shadow-sm">
                            {project.user_profiles?.display_name
                              ? project.user_profiles.display_name
                                  .charAt(0)
                                  .toUpperCase()
                              : "T"}
                          </div>
                          <span className="text-xs font-medium text-slate-500 truncate max-w-24">
                            {project.user_profiles?.display_name ||
                              "Tim Lainnya"}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300 flex items-center gap-1">
                          Buka Detail <span className="text-[14px]">›</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-8 h-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-6 pt-0 max-w-[1600px] mx-auto w-full flex flex-col gap-6 pb-6">
        <button
          onClick={() => setSelectedProjectId("")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:text-primary-700 hover:border-primary-300 hover:bg-primary-50 shadow-sm rounded-xl transition-all w-fit"
        >
          Kembali ke Daftar Portofolio Lainnya
        </button>

        {/* Detail Header & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 card p-6! border-0! bg-white/80! shadow-sm!">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 text-xs font-bold bg-primary-50 text-primary-600 rounded-lg">
                  Lainnya
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {projectData.nama_proyek}
              </h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setPeriodData({
                  start_date: projectData.start_date || "",
                  end_date: projectData.end_date || "",
                });
                setIsUpdateProgressOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <Calendar size={18} className="text-slate-400" />
              <span>Update Periode</span>
            </button>

            <button
              onClick={() => setShowManager(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-500 text-white font-bold text-sm hover:bg-slate-600 transition-all shadow-sm"
            >
              <Settings size={18} />
              Edit Proyek
            </button>
            <button
              onClick={() => handleDeleteProject(selectedProjectId)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 hover:text-red-700 transition-all shadow-sm border border-red-100"
            >
              <Trash2 size={18} />
              Hapus
            </button>
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
                  divisi="lainnya"
                  kategori="lainnya"
                  selectedProjectId={selectedProjectId}
                  onProjectSelected={(id) => {
                    setSelectedProjectId(id);
                    setShowManager(false);
                    fetchProject();
                  }}
                  onRefresh={fetchProject}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SCurveProgressChart data={sCurveData} />
            <MonthlyProgressTracker projectId={selectedProjectId} />
          </div>

          <ProjectDocumentsTable
            projectId={selectedProjectId}
            uploadedBy={user?.id || ""}
          />
        </div>
      </div>

      {/* Modal Update Periode */}
      {isUpdateProgressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsUpdateProgressOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Update Periode Pelaksanaan
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Tentukan tanggal mulai dan selesai untuk kurva-S
              </p>
              <button
                onClick={() => setIsUpdateProgressOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdatePeriod} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={periodData.start_date}
                    onChange={(e) =>
                      setPeriodData({ ...periodData, start_date: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={periodData.end_date}
                    min={periodData.start_date}
                    onChange={(e) =>
                      setPeriodData({ ...periodData, end_date: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUpdateProgressOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Spinner className="w-4 h-4" /> : null}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
