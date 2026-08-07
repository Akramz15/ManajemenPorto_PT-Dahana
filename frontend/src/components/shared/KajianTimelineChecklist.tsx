import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useDialogStore } from "@/store/dialogStore";
import { Plus, CheckCircle2, Circle, Trash2, FileText, Edit3 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import type { KajianTask, TaskStatus } from "@/types";

interface KajianTimelineChecklistProps {
  projectId: string;
}

export function KajianTimelineChecklist({ projectId }: KajianTimelineChecklistProps) {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<KajianTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add task state
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kajian_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("target_date", { ascending: false, nullsFirst: false });
        
      if (error) throw error;
      
      const tasksData = data || [];
      const userIds = [...new Set(tasksData.map(t => t.assigned_to).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", userIds);
          
        if (profiles) {
          const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          tasksData.forEach(t => {
            if (t.assigned_to && profileMap[t.assigned_to]) {
              (t as any).user_profiles = profileMap[t.assigned_to];
            }
          });
        }
      }
      
      setTasks(tasksData as any[]);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName || !newTaskDate || !session?.user?.id) return;
    
    setIsSaving(true);
    try {
      if (editingTaskId) {
        const { error } = await supabase
          .from("kajian_tasks")
          .update({
            nama_kajian: newTaskName,
            target_date: newTaskDate,
            notes: newTaskNotes,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingTaskId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kajian_tasks").insert([
          {
            project_id: projectId,
            nama_kajian: newTaskName,
            target_date: newTaskDate,
            notes: newTaskNotes,
            assigned_to: session.user.id,
            divisi: "komersial", // Defaulting to komersial based on current context
            status: "not_started"
          }
        ]);
        if (error) throw error;
      }
      
      setNewTaskName("");
      setNewTaskDate("");
      setNewTaskNotes("");
      setEditingTaskId(null);
      setIsAdding(false);
      fetchTasks();
      useDialogStore.getState().alert(editingTaskId ? "Berhasil memperbarui catatan kerja." : "Berhasil menambahkan catatan kerja.", { severity: "success" });
    } catch (err) {
      console.error(err);
      useDialogStore.getState().alert("Gagal menambahkan catatan kerja.", { severity: "danger" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "done" ? "not_started" : "done";
    try {
      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      const { error } = await supabase
        .from("kajian_tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
        
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      fetchTasks();
      useDialogStore.getState().alert("Gagal memperbarui status tugas.", { severity: "danger" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!await useDialogStore.getState().confirm("Apakah Anda yakin ingin menghapus catatan ini?", { severity: "danger" })) return;
    
    try {
      const { error } = await supabase.from("kajian_tasks").delete().eq("id", taskId);
      if (error) throw error;
      fetchTasks();
    } catch (err) {
      console.error(err);
      useDialogStore.getState().alert("Gagal menghapus catatan.", { severity: "danger" });
    }
  };

  const handleEditTask = (task: KajianTask) => {
    setEditingTaskId(task.id);
    setNewTaskName(task.nama_kajian);
    setNewTaskDate(task.target_date || "");
    setNewTaskNotes(task.notes || "");
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: Record<string, KajianTask[]> = {};
    tasks.forEach(task => {
      const dateKey = task.target_date || "Tanpa Tanggal";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });
    
    // Sort keys (dates descending)
    return Object.keys(groups).sort((a, b) => {
      if (a === "Tanpa Tanggal") return 1;
      if (b === "Tanpa Tanggal") return -1;
      return new Date(b).getTime() - new Date(a).getTime();
    }).map(date => ({
      date,
      tasks: groups[date]
    }));
  }, [tasks]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <FileText size={22} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              Update
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Kelola daftar checklist rencana dan rekam jejak pekerjaan.
            </p>
          </div>
        </div>
        
        {!isAdding && (
          <button 
            onClick={() => {
              setEditingTaskId(null);
              setNewTaskName("");
              setNewTaskDate("");
              setNewTaskNotes("");
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:-translate-y-0.5"
          >
            <Plus size={18} /> Tambah Log
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary-500/5 to-transparent pointer-events-none"></div>
          <form onSubmit={handleAddTask} className="flex flex-col gap-5 w-full relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Kegiatan / Tugas</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Menyusun draf kelayakan..."
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                <input 
                  type="date" 
                  required
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
              <textarea 
                rows={3}
                placeholder="Tambahkan detail informasi atau tautan dokumen..."
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all resize-y min-h-20"
              />
            </div>
            <div className="flex justify-end pt-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingTaskId(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={isSaving || !newTaskName || !newTaskDate}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:-translate-y-0.5"
              >
                {isSaving && <Spinner className="w-4 h-4" />}
                {editingTaskId ? "Simpan Perubahan" : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-6 bg-slate-50/30 overflow-y-auto custom-scrollbar max-h-150">
        {loading ? (
          <div className="flex justify-center p-12">
            <Spinner className="text-primary-500 w-8 h-8" />
          </div>
        ) : groupedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center mb-5 rotate-3 hover:rotate-0 transition-transform duration-300">
              <FileText className="text-slate-300 w-10 h-10 -rotate-3 hover:rotate-0 transition-transform duration-300" strokeWidth={1.5} />
            </div>
            <h4 className="text-base font-bold text-slate-700 mb-1">Belum Ada Catatan</h4>
            <p className="text-sm text-slate-500 max-w-xs mb-6 font-medium">Mulai catat log pekerjaan harian Anda atau buat rencana kegiatan untuk proyek ini.</p>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Buat Update Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {groupedTasks.map((group) => {
              const groupDate = group.date !== "Tanpa Tanggal" ? new Date(group.date) : null;
              if (groupDate) groupDate.setHours(0, 0, 0, 0);
              
              // Logic: If date is <= today, it's considered done automatically (no checkbox needed)
              const isPastOrToday = groupDate ? groupDate.getTime() <= today.getTime() : false;

              const formattedDate = groupDate ? groupDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              }) : group.date;

              return (
                <div key={group.date} className="relative">
                  <div className="flex items-center gap-3 mb-4 sticky top-0 bg-slate-50/90 backdrop-blur-sm py-2 z-10">
                    <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                    <h4 className="font-bold text-slate-800">{formattedDate}</h4>
                    {isPastOrToday && groupDate && (
                      <span className="bg-positive-50 text-positive-600 border border-positive-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Telah Berlalu
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3 pl-5 border-l-2 border-slate-100 ml-1">
                    {group.tasks.map((task) => (
                      <div key={task.id} className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
                        
                        {/* Checkbox or Check Icon */}
                        <div className="pt-0.5 shrink-0">
                          {isPastOrToday ? (
                            <CheckCircle2 className="text-positive-500 w-5 h-5" />
                          ) : (
                            <button 
                              onClick={() => handleToggleStatus(task.id, task.status)}
                              className="text-slate-300 hover:text-primary-500 transition-colors outline-none"
                            >
                              {task.status === "done" ? (
                                <CheckCircle2 className="text-positive-500 w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold leading-snug ${(isPastOrToday || task.status === "done") ? 'text-slate-800' : 'text-slate-700'}`}>
                            {task.nama_kajian}
                          </p>
                          {task.notes && (
                            <p className="text-xs text-slate-500 mt-1">{task.notes}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 font-medium">
                            {/* @ts-ignore */}
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{task.user_profiles?.display_name || "User"}</span>
                            <span>•</span>
                            <span>Diperbarui pada {new Date(task.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <button 
                            onClick={() => handleEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
