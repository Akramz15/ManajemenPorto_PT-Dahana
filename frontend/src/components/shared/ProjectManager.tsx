import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types";
import { Plus, Edit2, Trash2, FolderSync } from "lucide-react";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDialogStore } from "@/store/dialogStore";

interface ProjectManagerProps {
  divisi: "komersial" | "pertahanan";
  kategori: "berjalan" | "kajian";
  onProjectSelected?: (projectId: string) => void;
  selectedProjectId?: string;
  onRefresh?: () => void;
}

export function ProjectManager({
  divisi,
  kategori,
  onProjectSelected,
  selectedProjectId,
  onRefresh,
}: ProjectManagerProps) {
  const { session } = useAuth();
  const { confirm, alert } = useDialogStore();
  const currentUserId = session?.user?.id;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    nama_proyek: "",
    mitra: "",
    nilai_kontrak: "",
    start_date: "",
    end_date: "",
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("divisi", divisi)
      .eq("kategori", kategori)
      .order("created_at", { ascending: false });

    if (data) {
      setProjects(data as Project[]);
    }
    setLoading(false);
  }, [divisi, kategori]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const autoEditedRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0 && autoEditedRef.current !== selectedProjectId) {
      const proj = projects.find((p) => p.id === selectedProjectId);
      if (proj) {
        setEditingProject(proj);
        setFormData({
          nama_proyek: proj.nama_proyek,
          mitra: proj.mitra || "",
          nilai_kontrak: proj.nilai_kontrak ? proj.nilai_kontrak.toString() : "",
          start_date: proj.start_date || "",
          end_date: proj.end_date || "",
        });
        autoEditedRef.current = selectedProjectId;
      }
    }
  }, [selectedProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;

    setLoading(true);
    try {
      const payload = {
        divisi,
        kategori,
        nama_proyek: formData.nama_proyek,
        mitra: formData.mitra || null,
        nilai_kontrak: formData.nilai_kontrak
          ? parseInt(formData.nilai_kontrak)
          : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (editingProject) {
        await supabase
          .from("projects")
          .update(payload)
          .eq("id", editingProject.id);
        setFormData({
          nama_proyek: "",
          mitra: "",
          nilai_kontrak: "",
          start_date: "",
          end_date: "",
        });
        setEditingProject(null);
        await fetchProjects();
        if (onRefresh) onRefresh();
      } else {
        const { data } = await supabase
          .from("projects")
          .insert([{ ...payload, created_by: currentUserId }])
          .select();
        if (data && onProjectSelected) {
          onProjectSelected(data[0].id);
        } else {
          setFormData({
            nama_proyek: "",
            mitra: "",
            nilai_kontrak: "",
            start_date: "",
            end_date: "",
          });
          await fetchProjects();
          if (onRefresh) onRefresh();
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm(
        "Hapus proyek ini beserta semua tugas dan dokumen di dalamnya?",
        { severity: "danger" },
      ))
    )
      return;
    setLoading(true);
    await supabase.from("projects").delete().eq("id", id);
    await fetchProjects();
    if (onRefresh) onRefresh();
    if (selectedProjectId === id && onProjectSelected) {
      onProjectSelected("");
    }
    setLoading(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      nama_proyek: project.nama_proyek,
      mitra: project.mitra || "",
      nilai_kontrak: project.nilai_kontrak
        ? project.nilai_kontrak.toString()
        : "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
    });
  };

  const handleMoveToBerjalan = async (id: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf,.doc,.docx";
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !currentUserId) return;

      setLoading(true);
      try {
        // Upload document
        const filePath = `${id}/${Date.now()}_${file.name}`;
        await supabase.storage.from("documents").upload(filePath, file);

        // Save to documents table
        await supabase.from("documents").insert([
          {
            project_id: id,
            storage_path: filePath,
            file_name: file.name,
            file_size: file.size,
            uploaded_by: currentUserId,
          },
        ]);

        // Change kategori to berjalan
        await supabase
          .from("projects")
          .update({ kategori: "berjalan" })
          .eq("id", id);

        await fetchProjects();
        if (onRefresh) onRefresh();
        if (selectedProjectId === id && onProjectSelected)
          onProjectSelected("");
        alert("Proyek berhasil dipindahkan ke Project Berjalan!", {
          severity: "success",
        });
      } catch (err) {
        console.error(err);
        alert("Gagal memindahkan proyek.", { severity: "danger" });
      }
      setLoading(false);
    };
    fileInput.click();
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-8 pr-12">
        <h2 className="text-2xl font-black text-slate-800">
          Kelola Proyek {kategori === "kajian" ? "Kajian" : "Berjalan"}
        </h2>
      </div>

      <div className="flex flex-col space-y-8">
        {/* Form */}
        <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-5 uppercase tracking-wider">
            {editingProject ? "Edit Proyek" : "Tambah Proyek Baru"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Nama Proyek *
              </label>
              <input
                type="text"
                required
                value={formData.nama_proyek}
                onChange={(e) =>
                  setFormData({ ...formData, nama_proyek: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                placeholder="Masukkan nama proyek..."
              />
            </div>
            {/* Removed optional fields (Mitra, Nilai Kontrak) per user request */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Tanggal Selesai *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-slate-700"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              {editingProject && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setFormData({
                      nama_proyek: "",
                      mitra: "",
                      nilai_kontrak: "",
                      start_date: "",
                      end_date: "",
                    });
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : editingProject ? (
                  <Edit2 size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {editingProject ? "Simpan Perubahan" : "Simpan Proyek"}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
            Daftar Proyek
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-y-auto custom-scrollbar max-h-75">
              <table className="w-full text-left text-sm relative">
                <thead className="bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-5 py-4 font-bold text-slate-600">
                      Nama Proyek
                    </th>
                    <th className="px-5 py-4 font-bold text-slate-600 w-32 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {p.nama_proyek}
                        </p>
                        {p.mitra && (
                          <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
                            Mitra: {p.mitra}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          {kategori === "kajian" && (
                            <button
                              onClick={() => handleMoveToBerjalan(p.id)}
                              title="Pindahkan ke Berjalan (Upload Dokumen)"
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                            >
                              <FolderSync size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(p)}
                            title="Edit Proyek"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Hapus Proyek"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-5 py-12 text-center text-slate-400 font-medium"
                      >
                        Belum ada proyek.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
