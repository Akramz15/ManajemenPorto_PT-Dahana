import { useState, useEffect, useCallback } from "react";
import { useDialogStore } from "@/store/dialogStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui";
import { CheckCircle2, AlertCircle, PlayCircle, Lock } from "lucide-react";
import type { Project } from "@/types";

interface MonthlyProgressTrackerProps {
  project: Project;
  onUpdate?: () => void;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function MonthlyProgressTracker({ project, onUpdate }: MonthlyProgressTrackerProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("project_monthly_progress")
      .select("*")
      .eq("project_id", project.id)
      .eq("year", selectedYear);
    
    if (data) {
      setProgressData(data);
    }
    setLoading(false);
  }, [project.id, selectedYear]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleUpdateStatus = async (month: number, status: string) => {
    if (!currentUserId) return;
    setUpdating(true);
    
    try {
      const existing = progressData.find(p => p.month === month);
      
      if (existing) {
        await supabase
          .from("project_monthly_progress")
          .update({ status, updated_by: currentUserId, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("project_monthly_progress")
          .insert([{
            project_id: project.id,
            month,
            year: selectedYear,
            status,
            updated_by: currentUserId
          }]);
      }
      
      await fetchProgress();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      useDialogStore.getState().alert("Gagal memperbarui progres.", { severity: 'danger' });
    }
    setUpdating(false);
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner className="text-primary-500" /></div>;
  }

  // Determine which months to show based on project dates
  const startY = project.start_date ? new Date(project.start_date).getFullYear() : selectedYear;
  const endY = project.end_date ? new Date(project.end_date).getFullYear() : selectedYear;
  const startM = project.start_date && selectedYear === startY ? new Date(project.start_date).getMonth() + 1 : 1;
  const endM = project.end_date && selectedYear === endY ? new Date(project.end_date).getMonth() + 1 : 12;

  // Years options
  const years = [];
  for (let y = startY; y <= endY; y++) {
    years.push(y);
  }
  if (years.length === 0) years.push(selectedYear);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <PlayCircle className="text-primary-500" size={18} />
            Update Progres Bulanan
          </h3>
          <p className="text-xs text-slate-500 mt-1">Perbarui status proyek setiap bulan untuk generate Kurva S.</p>
        </div>
        
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-primary-500 shadow-sm"
        >
          {years.map(y => (
            <option key={y} value={y}>Tahun {y}</option>
          ))}
        </select>
      </div>

      <div className="p-6 overflow-x-auto pb-8 -mb-2 custom-scrollbar">
        <div className="flex items-stretch gap-4 min-w-max pb-2">
          {MONTHS.map((monthName, index) => {
            const monthNum = index + 1;
            const isOutOfRange = selectedYear === startY && monthNum < startM || selectedYear === endY && monthNum > endM;
            const progress = progressData.find(p => p.month === monthNum);
            
            if (isOutOfRange) {
              return (
                <div key={monthNum} className="w-48 shrink-0 border border-slate-100 bg-slate-50/50 rounded-2xl p-5 flex flex-col items-center justify-center opacity-60">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-400">{monthName} {selectedYear}</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Terkunci</span>
                </div>
              );
            }

            return (
              <div key={monthNum} className={`w-52 shrink-0 border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${progress?.status === 'On-track' ? 'border-emerald-200 bg-emerald-50/50 shadow-emerald-500/5' : progress?.status === 'Delay' ? 'border-rose-200 bg-rose-50/50 shadow-rose-500/5' : progress?.status === 'Close' ? 'border-indigo-200 bg-indigo-50/50 shadow-indigo-500/5' : 'border-slate-200 bg-white hover:border-primary-300 shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                    progress?.status === 'On-track' ? 'bg-emerald-100 text-emerald-600' :
                    progress?.status === 'Delay' ? 'bg-rose-100 text-rose-600' :
                    progress?.status === 'Close' ? 'bg-indigo-100 text-indigo-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {progress?.status === 'On-track' && <CheckCircle2 size={22} />}
                    {progress?.status === 'Delay' && <AlertCircle size={22} />}
                    {progress?.status === 'Close' && <CheckCircle2 size={22} />}
                    {!progress?.status && <span className="text-sm font-black">{monthNum}</span>}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{monthName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedYear}</p>
                  </div>
                </div>
                
                <div className="relative">
                  <select 
                    value={progress?.status || ""}
                    onChange={(e) => handleUpdateStatus(monthNum, e.target.value)}
                    disabled={updating}
                    className={`w-full text-xs font-bold px-3 py-3 rounded-xl border outline-none transition-all cursor-pointer appearance-none text-center shadow-sm ${
                      progress?.status === 'On-track' ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 
                      progress?.status === 'Delay' ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 
                      progress?.status === 'Close' ? 'bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20' : 
                      'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800 focus:ring-2 focus:ring-primary-500/20'
                    }`}
                  >
                    <option value="" disabled>Atur Status...</option>
                    <option value="On-track">🟢 On-track</option>
                    <option value="Delay">🔴 Delay</option>
                    <option value="Close">🟣 Close</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
