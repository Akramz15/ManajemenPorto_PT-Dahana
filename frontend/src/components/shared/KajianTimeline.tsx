import type { KajianTask, TaskStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface KajianTimelineProps {
  tasks: KajianTask[];
  divisi: "komersial" | "pertahanan";
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const STATUS_MAP: Record<TaskStatus, { label: string; dot: string; bg: string }> = {
  not_started: { label: "Menunggu", dot: "bg-slate-300", bg: "bg-slate-50" },
  in_progress: { label: "Berjalan", dot: "bg-primary-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]", bg: "bg-primary-50/50" },
  done: { label: "Selesai", dot: "bg-positive-500", bg: "bg-white border border-positive-100" },
  blocked: { label: "Terhambat", dot: "bg-negative-500", bg: "bg-negative-50" },
};

export function KajianTimeline({ tasks, onStatusChange }: KajianTimelineProps) {
  if (!tasks.length) {
    return (
      <div className="card p-6 min-h-75 flex flex-col relative overflow-hidden group justify-center items-center text-slate-400">
        <p className="text-sm font-medium">Belum ada data kajian untuk divisi ini.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-800 mb-6 px-1">Tahapan Kajian Kolaboratif</h3>
      <div className="relative pl-3">
        {/* Timeline line */}
        <div className="absolute top-3 bottom-5 left-3.75 w-px bg-slate-200"></div>

        <div className="space-y-6">
          {tasks.map((task, idx) => {
            const config = STATUS_MAP[task.status];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const user = task as any; // any for user_profiles join
            const userName = user.user_profiles?.display_name || "Unknown";

            return (
              <div key={task.id} className="relative pl-10 pr-2">
                {/* Dot */}
                <div className={`absolute left-0 top-3 w-1.75 h-1.75 rounded-full z-10 -translate-x-0.75 transition-all duration-300 ${config.dot}`} />
                
                <div className={`p-4 rounded-xl transition-all duration-200 ${task.status === "done" ? "shadow-sm border border-slate-100" : config.bg}`}>
                  <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {task.tahapan || `Tahap ${idx + 1}`}
                      </p>
                      <h4 className="text-sm font-bold text-slate-800 mb-2 leading-snug">
                        {task.nama_kajian}
                      </h4>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                          {userName.charAt(0)}
                        </div>
                        <p className="text-xs font-medium text-slate-600">{userName}</p>
                        <span className="text-slate-300 mx-1">•</span>
                        <p className="text-[10px] text-slate-400">
                          Update {formatDistanceToNow(new Date(task.updated_at), { locale: id, addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto flex justify-end">
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white
                                     cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-200 shadow-sm min-w-32"
                        >
                          {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                    </div>
                  </div>

                  {task.notes && (
                    <div className="mt-3 p-3 bg-white/60 rounded-lg text-xs text-slate-600 border border-slate-100/50">
                      {task.notes}
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
