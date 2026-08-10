import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Activity, FileText, CalendarDays } from "lucide-react";
import type { Project, KajianTask } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

interface PipelineProjectItemProps {
  project: Project;
  activePipelineTab: "kajian" | "berjalan";
  progressText: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function PipelineProjectItem({ project, activePipelineTab, progressText }: PipelineProjectItemProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kajianData, setKajianData] = useState<{ monthKey: string; monthName: string; year: number; updates: KajianTask[]; rencana: KajianTask[] }[]>([]);
  const [berjalanData, setBerjalanData] = useState<{ monthKey: string; monthName: string; year: number; activities: any[] }[]>([]);

  const fetchKajianData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kajian_tasks")
        .select("*")
        .eq("project_id", project.id)
        .order("target_date", { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      const tasks = (data || []) as KajianTask[];
      const grouped: Record<string, { updates: KajianTask[], rencana: KajianTask[], monthName: string, year: number }> = {};
      
      tasks.forEach(task => {
        if (!task.target_date) return; // Skip tasks without date for summary
        
        const date = new Date(task.target_date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            updates: [],
            rencana: [],
            monthName: MONTH_NAMES[month],
            year: year
          };
        }
        
        // Use any to bypass TS error if task_type is not in KajianTask type yet
        if ((task as any).task_type === "rencana_kedepan") {
          grouped[monthKey].rencana.push(task);
        } else {
          grouped[monthKey].updates.push(task);
        }
      });
      
      const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      setKajianData(sortedKeys.map(k => ({ monthKey: k, ...grouped[k] })));
      
    } catch (error) {
      console.error("Error fetching kajian data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBerjalanData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("project_progress_activities")
        .select("*")
        .eq("project_id", project.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      
      const activities = data || [];
      const grouped: Record<string, { activities: any[], monthName: string, year: number }> = {};
      
      activities.forEach(act => {
        const monthIndex = act.month - 1; // month is 1-12
        const monthKey = `${act.year}-${monthIndex.toString().padStart(2, '0')}`;
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            activities: [],
            monthName: MONTH_NAMES[monthIndex],
            year: act.year
          };
        }
        
        grouped[monthKey].activities.push(act);
      });
      
      const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      setBerjalanData(sortedKeys.map(k => ({ monthKey: k, ...grouped[k] })));
      
    } catch (error) {
      console.error("Error fetching berjalan data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      if (activePipelineTab === "kajian" && kajianData.length === 0) {
        fetchKajianData();
      } else if (activePipelineTab === "berjalan" && berjalanData.length === 0) {
        fetchBerjalanData();
      }
    }
  }, [isExpanded, activePipelineTab, project.id]);

  return (
    <div className="group flex flex-col rounded-2xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100/50 overflow-hidden">
      {/* Header / Clickable Area */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between py-4 px-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className={`w-2 h-10 rounded-full bg-primary-400 ${isExpanded ? "opacity-100" : "opacity-50 group-hover:opacity-100"} transition-opacity`}></div>
          <div>
            <h4 className={`font-bold text-base mb-0.5 transition-colors ${isExpanded ? "text-primary-600" : "text-slate-800 group-hover:text-primary-600"}`}>
              {project.nama_proyek}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                Divisi {project.divisi}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md text-primary-600 bg-primary-50">
                {progressText}
              </span>
            </div>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm transition-all ${isExpanded ? "scale-110 text-primary-600 border-primary-100 rotate-90" : "group-hover:scale-110 group-hover:text-primary-600 group-hover:border-primary-100"}`}>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-5 pl-10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="border-t border-slate-100/80 pt-4 mt-1">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays size={14} />
                Ringkasan Pekerjaan Bulanan
              </h5>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/pu/${project.divisi}/${activePipelineTab}?project=${project.id}`);
                }}
                className="text-[11px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors flex items-center gap-1 shadow-sm"
              >
                Buka Detail Proyek <ChevronRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="py-8 flex justify-center">
                <Spinner size="md" className="text-primary-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {activePipelineTab === "kajian" ? (
                  kajianData.length > 0 ? (
                    kajianData.map((group) => (
                      <div key={group.monthKey} className="pl-2 border-l-2 border-slate-100">
                        <h6 className="text-sm font-bold text-slate-700 mb-3 ml-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 -ml-[13px] ring-4 ring-white"></span>
                          {group.monthName} {group.year}
                        </h6>
                        
                        <div className="ml-4 space-y-4">
                          {group.updates.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Activity size={12} /> Update
                              </p>
                              <ul className="space-y-1.5">
                                {group.updates.map(task => (
                                  <li key={task.id} className="text-sm text-slate-600 flex items-start gap-2">
                                    <span className="text-slate-300 mt-0.5">•</span> 
                                    <span className={task.status === "done" ? "line-through opacity-70" : ""}>{task.nama_kajian}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {group.rencana.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FileText size={12} /> Rencana Kedepan
                              </p>
                              <ul className="space-y-1.5">
                                {group.rencana.map(task => (
                                  <li key={task.id} className="text-sm text-slate-600 flex items-start gap-2">
                                    <span className="text-slate-300 mt-0.5">•</span> 
                                    <span className={task.status === "done" ? "line-through opacity-70" : ""}>{task.nama_kajian}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400 italic py-2 ml-2">Belum ada tugas ber-tanggal di proyek ini.</div>
                  )
                ) : (
                  berjalanData.length > 0 ? (
                    berjalanData.map((group) => (
                      <div key={group.monthKey} className="pl-2 border-l-2 border-slate-100">
                        <h6 className="text-sm font-bold text-slate-700 mb-3 ml-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 -ml-[13px] ring-4 ring-white"></span>
                          {group.monthName} {group.year}
                        </h6>
                        
                        <ul className="ml-4 space-y-1.5">
                          {group.activities.map(act => (
                            <li key={act.id} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-slate-300 mt-0.5">•</span> 
                              <span>{act.activity_name} <span className="text-xs text-slate-400 font-medium ml-1">({act.weight_percentage}%)</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400 italic py-2 ml-2">Belum ada ringkasan aktivitas di proyek ini.</div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
