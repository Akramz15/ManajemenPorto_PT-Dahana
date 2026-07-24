import { useState, useEffect, useCallback } from "react";
import { useDialogStore } from "@/store/dialogStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui";
import { PlayCircle, Lock, ListChecks, Plus, Trash2, X, Edit2, Save } from "lucide-react";
import type { Project, ProjectProgressActivity } from "@/types/api.types";

interface MonthlyProgressTrackerProps {
  project: Project;
  onUpdate?: () => void;
  onClose?: () => void;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function MonthlyProgressTracker({
  project,
  onUpdate,
  onClose,
}: MonthlyProgressTrackerProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [activities, setActivities] = useState<ProjectProgressActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  // Modal states
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityWeight, setNewActivityWeight] = useState("");
  
  // Edit state
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityName, setEditActivityName] = useState("");
  const [editActivityWeight, setEditActivityWeight] = useState("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("project_progress_activities")
      .select("*")
      .eq("project_id", project.id)
      .eq("year", selectedYear)
      .order("created_at", { ascending: true });

    if (data) {
      setActivities(data);
    }
    setLoading(false);
  }, [project.id, selectedYear]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !editingMonth || !newActivityName || !newActivityWeight) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from("project_progress_activities").insert([
        {
          project_id: project.id,
          month: editingMonth,
          year: selectedYear,
          activity_name: newActivityName,
          weight_percentage: parseFloat(newActivityWeight),
          created_by: currentUserId,
        },
      ]);

      if (error) throw error;
      
      setNewActivityName("");
      setNewActivityWeight("");
      await fetchActivities();
      useDialogStore.getState().alert("Pekerjaan berhasil ditambahkan!", { severity: "success" });
    } catch (err: any) {
      console.error(err);
      useDialogStore.getState().alert("Gagal menambahkan pekerjaan: " + err.message, { severity: "danger" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateActivity = async (e: React.FormEvent, actId: string) => {
    e.preventDefault();
    if (!editActivityName.trim() || !editActivityWeight || isSaving) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("project_progress_activities")
        .update({
          activity_name: editActivityName.trim(),
          weight_percentage: parseFloat(editActivityWeight),
        })
        .eq("id", actId);

      if (error) throw error;
      
      setEditingActivityId(null);
      await fetchActivities();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      useDialogStore.getState().alert("Gagal mengubah pekerjaan: " + err.message, { severity: "danger" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!currentUserId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("project_progress_activities").delete().eq("id", id);
      if (error) throw error;
      await fetchActivities();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error(err);
      useDialogStore.getState().alert("Gagal menghapus pekerjaan.", { severity: "danger" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner className="text-primary-500" />
      </div>
    );
  }

  // Determine which months to show based on project dates
  const startY = project.start_date
    ? new Date(project.start_date).getFullYear()
    : selectedYear;
  const endY = project.end_date
    ? new Date(project.end_date).getFullYear()
    : selectedYear;
  const startM =
    project.start_date && selectedYear === startY
      ? new Date(project.start_date).getMonth() + 1
      : 1;
  const endM =
    project.end_date && selectedYear === endY
      ? new Date(project.end_date).getMonth() + 1
      : 12;

  // Years options
  const years = [];
  for (let y = startY; y <= endY; y++) {
    years.push(y);
  }
  if (years.length === 0) years.push(selectedYear);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <PlayCircle className="text-primary-500" size={18} />
            Update Progres Bulanan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tambahkan rincian pekerjaan untuk generate Kurva S otomatis.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 shadow-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
              title="Tutup Modal"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 overflow-x-auto pb-8 -mb-2 custom-scrollbar">
        <div className="flex items-stretch gap-4 min-w-max pb-2">
          {MONTHS.map((monthName, index) => {
            const monthNum = index + 1;
            const isOutOfRange =
              (selectedYear === startY && monthNum < startM) ||
              (selectedYear === endY && monthNum > endM);
            
            const monthActivities = activities.filter((a) => a.month === monthNum);
            const totalWeight = monthActivities.reduce((acc, curr) => acc + Number(curr.weight_percentage), 0);
            const hasData = monthActivities.length > 0;

            if (isOutOfRange) {
              return (
                <div
                  key={monthNum}
                  className="w-48 shrink-0 border border-slate-100 bg-slate-50/50 rounded-2xl p-5 flex flex-col items-center justify-center opacity-60"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-400">
                    {monthName} {selectedYear}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    Terkunci
                  </span>
                </div>
              );
            }

            return (
              <div
                key={monthNum}
                className={`w-52 shrink-0 border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${hasData ? "border-primary-200 bg-primary-50/30 shadow-primary-500/5" : "border-slate-200 bg-white hover:border-primary-300 shadow-sm"}`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                      hasData
                        ? "bg-primary-100 text-primary-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {hasData ? (
                      <ListChecks size={22} />
                    ) : (
                      <span className="text-sm font-black">{monthNum}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {monthName}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedYear}
                    </p>
                  </div>
                </div>

                <div className="relative space-y-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-500 font-medium mb-1">Total Bobot</span>
                    <span className={`text-lg font-black ${hasData ? "text-primary-600" : "text-slate-400"}`}>{totalWeight.toFixed(1)}%</span>
                  </div>
                  <button
                    onClick={() => setEditingMonth(monthNum)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all shadow-sm"
                  >
                    {hasData ? "Lihat/Ubah Rincian" : "Tambah Pekerjaan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activities Modal Overlay */}
      {editingMonth && (
        <div className="absolute inset-0 z-10 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ListChecks className="text-primary-500" size={18} />
                Rincian Pekerjaan - {MONTHS[editingMonth - 1]} {selectedYear}
              </h3>
              <button 
                onClick={() => setEditingMonth(null)}
                className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              {activities.filter(a => a.month === editingMonth).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm font-medium">
                  Belum ada pekerjaan di bulan ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.filter(a => a.month === editingMonth).map(act => {
                    if (editingActivityId === act.id) {
                      return (
                        <form 
                          key={act.id} 
                          onSubmit={(e) => handleUpdateActivity(e, act.id)}
                          className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3"
                        >
                          <input 
                            type="text"
                            required
                            value={editActivityName}
                            onChange={(e) => setEditActivityName(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 shadow-sm"
                          />
                          <div className="relative w-24 shrink-0">
                            <input 
                              type="number"
                              required
                              min="0.1"
                              max="100"
                              step="0.1"
                              value={editActivityWeight}
                              onChange={(e) => setEditActivityWeight(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-6 py-1.5 text-sm outline-none focus:border-primary-500 shadow-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              type="button"
                              onClick={() => setEditingActivityId(null)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              <X size={16} />
                            </button>
                            <button 
                              type="submit"
                              disabled={isSaving}
                              className="p-1.5 text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
                            >
                              {isSaving ? <Spinner size="sm" /> : <Save size={16} />}
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div key={act.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 group">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{act.activity_name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">DITAMBAHKAN PADA {new Date(act.created_at).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-primary-600 text-sm bg-primary-100 px-2 py-1 rounded-lg">{Number(act.weight_percentage).toFixed(1)}%</span>
                          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingActivityId(act.id);
                                setEditActivityName(act.activity_name);
                                setEditActivityWeight(act.weight_percentage.toString());
                              }}
                              disabled={isSaving}
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Edit Pekerjaan"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteActivity(act.id)}
                              disabled={isSaving}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Hapus Pekerjaan"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <form onSubmit={handleAddActivity} className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Nama Pekerjaan..." 
                  required
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 shadow-sm"
                />
                <div className="relative w-28 shrink-0">
                  <input 
                    type="number" 
                    placeholder="Bobot"
                    step="0.1" 
                    min="0"
                    max="100"
                    required
                    value={newActivityWeight}
                    onChange={(e) => setNewActivityWeight(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-2.5 text-sm outline-none focus:border-primary-500 shadow-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
                </div>
                <button 
                  type="submit"
                  disabled={isSaving || !newActivityName || !newActivityWeight}
                  className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm shrink-0"
                >
                  {isSaving ? <Spinner className="w-5 h-5" /> : <Plus size={20} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
