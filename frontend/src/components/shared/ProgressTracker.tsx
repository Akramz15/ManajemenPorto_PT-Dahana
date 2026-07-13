import type { TaskStatus, ProgressTask } from "@/types";
import { format } from "date-fns";
import { Check, RefreshCw, Wrench, Circle, Plus, Trash2, X, Clock } from "lucide-react";
import { useState } from "react";
import { useDialogStore } from "@/store/dialogStore";

const STATUS_CONFIG: Record<TaskStatus, { label: string; badgeColor: string; iconColor: string; iconBg: string; Icon: any; progress: number }> = {
  done: { 
    label: "Selesai", 
    badgeColor: "bg-positive-50 text-positive-700 border-positive-200 hover:bg-positive-100", 
    iconColor: "text-white", 
    iconBg: "bg-positive-500",
    Icon: Check,
    progress: 100 
  },
  in_progress: { 
    label: "Berjalan", 
    badgeColor: "bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100", 
    iconColor: "text-white", 
    iconBg: "bg-primary-500",
    Icon: RefreshCw,
    progress: 50 
  },
  not_started: { 
    label: "Menunggu", 
    badgeColor: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50", 
    iconColor: "text-slate-400", 
    iconBg: "bg-slate-100",
    Icon: Circle,
    progress: 0 
  },
  blocked: { 
    label: "Terhambat", 
    badgeColor: "bg-negative-50 text-negative-700 border-negative-200 hover:bg-negative-100", 
    iconColor: "text-white", 
    iconBg: "bg-negative-500",
    Icon: Wrench,
    progress: 0 
  },
};

interface ProgressTrackerProps {
  tasks: ProgressTask[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddTask?: (title: string) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export function ProgressTracker({ tasks, onStatusChange, onAddTask, onDeleteTask }: ProgressTrackerProps) {
  const { confirm } = useDialogStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !onAddTask) return;
    
    setIsSubmitting(true);
    try {
      await onAddTask(newTaskTitle);
      setNewTaskTitle("");
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRunning = tasks.some(t => t.status === "in_progress");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-800">Timeline Progres & Tim</h3>
          <p className="text-xs text-slate-500 mt-0.5">Pantau status pencapaian tugas proyek</p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-positive-50 text-positive-700 border border-positive-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-positive-500 rounded-full animate-pulse" />
              Running
            </span>
          )}
          {onAddTask && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-sm"
            >
              <Plus size={14} className="text-slate-400" /> Tambah Task
            </button>
          )}
        </div>
      </div>

      <div className={`relative flex-1 mt-2 ${(tasks.length > 0 || isAdding) ? 'pl-10' : ''}`}>
        {/* Vertical Line */}
        {(tasks.length > 0 || isAdding) && (
          <div className="absolute left-3 top-3 bottom-0 w-px bg-slate-200" />
        )}

        <div className="space-y-4">
          {isAdding && (
            <div className="relative animate-in fade-in slide-in-from-top-2">
              <div className="absolute -left-10 top-2 w-6 h-6 rounded-full bg-slate-100 border-4 border-white text-slate-400 flex items-center justify-center shadow-sm z-10 ring-1 ring-slate-200">
                <Plus size={12} strokeWidth={3} />
              </div>
              <div className="bg-white p-3 rounded-xl border border-primary-200 shadow-sm ring-2 ring-primary-50">
                <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Judul task baru..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1 bg-transparent px-2 py-1.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setNewTaskTitle(""); }}
                    disabled={isSubmitting}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <button 
                    type="submit" 
                    disabled={!newTaskTitle.trim() || isSubmitting}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </form>
              </div>
            </div>
          )}

          {!tasks.length && !isAdding && (
             <div className="py-24 min-h-87.5 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50">
               <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                 <Circle size={20} className="opacity-50" />
               </div>
               <h4 className="text-sm font-bold text-slate-700 mb-1">Board Masih Kosong</h4>
               <p className="text-xs text-slate-500 max-w-xs mb-4">Mulai kelola progres proyek dengan menambahkan tugas pertama.</p>
               {onAddTask && (
                 <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 shadow-sm text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all">
                   <Plus size={16} className="text-slate-400"/> Buat Task
                 </button>
               )}
             </div>
          )}

          {tasks.map((task) => {
            const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
            const userName = task.user_profiles?.display_name || "Unknown User";
            const Icon = config.Icon;

            return (
              <div key={task.id} className="relative group">
                {/* Timeline Icon */}
                <div className={`absolute -left-10 top-2 w-6 h-6 rounded-full border-4 border-white ${config.iconBg} ${config.iconColor} flex items-center justify-center z-10 ring-1 ring-slate-200/60 shadow-sm transition-transform group-hover:scale-110`}>
                  <Icon size={10} strokeWidth={3} />
                </div>

                {/* Content Card */}
                <div className={`p-4 rounded-xl border transition-all duration-200 ${
                  task.status === 'in_progress' ? 'bg-primary-50/20 border-primary-100 shadow-[0_2px_10px_-4px_rgba(59,130,246,0.1)]' 
                  : task.status === 'done' ? 'bg-white border-slate-100 opacity-75 hover:opacity-100'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {task.title}
                      </h4>
                      
                      <div className="flex items-center gap-3 mt-1.5">
                        {task.status !== 'not_started' ? (
                          <span className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                            Oleh: <span className="font-semibold text-slate-700">{userName}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-300" />
                            Ditambahkan: {format(new Date(task.updated_at), "dd MMM")}
                          </span>
                        )}
                        
                        {task.status === 'done' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[11px] text-slate-400 italic">
                              Selesai {format(new Date(task.updated_at), "dd MMM")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {onDeleteTask && (
                        <button 
                          onClick={async () => { if(await confirm("Hapus task ini?", { severity: 'danger' })) onDeleteTask(task.id); }}
                          className="p-1.5 text-slate-400 hover:text-negative-600 hover:bg-negative-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Hapus Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="relative">
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors uppercase tracking-wider ${config.badgeColor}`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key} className="bg-white text-slate-800 font-semibold">{val.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for IN PROGRESS */}
                  {task.status === 'in_progress' && (
                    <div className="mt-3.5 flex items-center gap-3">
                      <div className="h-1 flex-1 bg-primary-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full w-1/2 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

