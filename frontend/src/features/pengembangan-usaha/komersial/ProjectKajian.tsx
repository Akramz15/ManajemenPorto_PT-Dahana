import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ProjectManager, ProjectDocumentsTable } from "@/components/shared";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  MapPin,
  Plus,
  Settings,
  FolderOpen,
  Search,
  User,
  Clock,
  Trash2,
} from "lucide-react";
import { useDialogStore } from "@/store/dialogStore";
import type { Project } from "@/types";

export default function ProjectKajian() {
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
    // Fetch all kajian projects for komersial
    const fetchAllProjects = async () => {
      // Adding join to user_profiles if it exists, otherwise it will just gracefully fail or ignore
      const { data, error } = await supabase
        .from("projects")
        .select(`*, user_profiles(display_name)`)
        .eq("divisi", "komersial")
        .eq("kategori", "kajian")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setAllProjects(data as any[]);
      } else {
        // Fallback if relation doesn't exist
        const fallback = await supabase
          .from("projects")
          .select("*")
          .eq("divisi", "komersial")
          .eq("kategori", "kajian")
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

  const handleTransferProject = async (projectId: string) => {
    if (
      !(await confirm(
        "Apakah Anda yakin ingin mentransfer proyek ini ke Berjalan? Proyek akan dipindahkan dari halaman Kajian ke halaman Project Berjalan.",
        { severity: "info" },
      ))
    )
      return;
    try {
      await supabase
        .from("projects")
        .update({ kategori: "berjalan" })
        .eq("id", projectId);
      setSelectedProject("");
      window.location.reload();
    } catch (e) {
      console.error("Failed to transfer project", e);
      alert("Gagal mentransfer proyek.", { severity: "danger" });
    }
  };

  const filteredProjects = allProjects.filter((p) =>
    p.nama_proyek.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      {/* Breadcrumbs & Header */}
      {selectedProject && (
        <button
          onClick={() => setSelectedProject("")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:text-primary-700 hover:border-primary-300 hover:bg-primary-50 shadow-sm rounded-xl transition-all w-fit -mt-2"
        >
          Kembali ke Workspace
        </button>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex items-center text-sm font-medium text-slate-500 mb-4">
          <span>Pengembangan Usaha</span>
          <span className="mx-2">›</span>
          <span>Komersial</span>
          <span className="mx-2">›</span>
          <span className="text-primary-600 font-bold">Project Kajian</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {selectedProject
                ? projectData?.nama_proyek
                : "Workspace: Project Kajian"}
            </h1>
            {selectedProject ? (
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary-600" />
                  <span>Area Komersial (Kajian)</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-slate-800 px-2 py-0.5 bg-slate-200 rounded-md">
                  {projectData?.id
                    ? `ID-${projectData.id.split("-")[0].toUpperCase()}`
                    : "ID-XXXX"}
                </span>
              </div>
            ) : (
              <p className="text-slate-500 mt-1">
                Kelola timeline proposal dan studi kelayakan proyek divisi
                komersial.
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
                <button
                  onClick={() => handleTransferProject(selectedProject)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5"
                >
                  Transfer ke Berjalan
                </button>
              </>
            ) : allProjects.length > 0 ? (
              <button
                onClick={() => setShowManager(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5"
              >
                <Plus size={18} />
                Tambah Kajian Baru
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {showManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowManager(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              ✕
            </button>
            <ProjectManager
              divisi="komersial"
              kategori="kajian"
              selectedProjectId={selectedProject}
              onProjectSelected={(id) => {
                setSelectedProject(id);
                setShowManager(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      {selectedProject ? (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-50/50 rounded-full blur-2xl"></div>
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                Informasi Proyek
              </h3>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User size={12} /> Ditambahkan Oleh
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {/* @ts-ignore */}
                    {projectData?.user_profiles?.display_name ||
                      "Pengguna (Tidak Diketahui)"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock size={12} /> Dibuat Pada
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {projectData?.created_at
                      ? new Date(projectData.created_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      : "-"}
                  </p>
                </div>
                {projectData?.start_date && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      Start Date
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {new Date(projectData.start_date).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>
                )}
                {projectData?.end_date && (
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      End Date
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {new Date(projectData.end_date).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <ProjectDocumentsTable projectId={selectedProject} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 min-h-[70vh] flex flex-col overflow-hidden">
          {/* Header Workspace */}
          <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FolderOpen className="text-primary-500" /> Semua Proyek Kajian
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
                placeholder="Cari nama kajian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="p-6 flex-1 bg-slate-50/30">
            {allProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
                  <FolderOpen className="w-10 h-10 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-700 mb-2">
                  Workspace Kosong
                </h4>
                <p className="text-sm font-medium text-center max-w-sm">
                  Belum ada proyek kajian di divisi komersial. Semua anggota tim
                  dapat menambahkan proyek baru ke dalam workspace ini.
                </p>
                <button
                  onClick={() => setShowManager(true)}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary-600 text-white shadow-lg shadow-primary-500/30 rounded-xl text-sm font-bold hover:bg-primary-700 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={18} /> Buat Kajian Pertama
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
                    className="group relative flex flex-col p-6 bg-white rounded-3xl hover:bg-slate-50/50 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-slate-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-primary-50/50 to-transparent rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-700"></div>

                    <div className="flex justify-between items-start mb-5">
                      <div className="w-12 h-12 bg-primary-50/80 text-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                        <FolderOpen size={22} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 px-3 py-1.5 rounded-full border border-slate-100/80">
                        ID-{project.id.split("-")[0]}
                      </span>
                    </div>

                    <h4 className="text-xl font-bold tracking-tight text-slate-800 mb-1 line-clamp-2 leading-tight group-hover:text-primary-700 transition-colors">
                      {project.nama_proyek}
                    </h4>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 border border-slate-200/50">
                          {/* @ts-ignore */}
                          {project.user_profiles?.display_name
                            ? project.user_profiles.display_name
                                .charAt(0)
                                .toUpperCase()
                            : "T"}
                        </div>
                        <span className="text-sm font-medium text-slate-500 truncate max-w-30">
                          {/* @ts-ignore */}
                          {project.user_profiles?.display_name ||
                            "Tim Komersial"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-primary-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                        Masuk Timeline &rarr;
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
  );
}
