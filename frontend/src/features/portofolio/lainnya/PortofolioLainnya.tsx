import { useState, useCallback, useEffect } from "react";
import { Briefcase, Building2, Edit3, Calendar, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SCurveProgressChart } from "@/components/charts";
import { MonthlyProgressTracker, ProjectDocumentsTable } from "@/components/shared";
import { Spinner } from "@/components/ui";
import { useDialogStore } from "@/store/dialogStore";
import type { Project } from "@/types/api.types";

export default function PortofolioLainnya() {
  const { alert } = useDialogStore();
  const [activeTab, setActiveTab] = useState<"streamlining" | "akuisisi">(
    "streamlining",
  );
  const [sCurveData, setSCurveData] = useState<any[]>([]);
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [periodData, setPeriodData] = useState({ start_date: "", end_date: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [projectData, setProjectData] = useState<Project | null>(null);

  const projectId = `porto-lainnya-${activeTab}`;
  
  // Default mock project if not found in DB
  const currentProject: Project = projectData || {
    id: projectId,
    nama_proyek: activeTab === "streamlining" ? "Streamlining" : "Akuisisi",
    start_date: `${new Date().getFullYear()}-01-01`,
    end_date: `${new Date().getFullYear()}-12-31`,
    divisi: "lainnya",
    kategori: "lainnya",
    mitra: null,
    nilai_kontrak: null,
    created_by: "system",
    created_at: new Date().toISOString(),
  };

  const fetchProject = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    
    if (data) {
      setProjectData(data as Project);
    } else {
      setProjectData(null);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const fetchDynamicSCurve = useCallback(async () => {
    const { data: progressData } = await supabase
      .from("project_progress_activities")
      .select("*")
      .eq("project_id", projectId)
      .order("year", { ascending: true })
      .order("month", { ascending: true });

    const start = currentProject.start_date
      ? new Date(currentProject.start_date)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = currentProject.end_date
      ? new Date(currentProject.end_date)
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
        periode: `${MONTHS[m - 1]} ${y}`,
        rencana: parseFloat(expectedAccum.toFixed(1)),
        realisasi: plotRealisasi ? parseFloat(currentRealisasi.toFixed(1)) : null,
        activities: monthActivities,
      });
    }

    setSCurveData(curve);
  }, [projectId, currentProject.start_date, currentProject.end_date]);

  useEffect(() => {
    fetchDynamicSCurve();
  }, [fetchDynamicSCurve]);

  return (
    <div className="px-6 pt-0 pb-6 max-w-[1600px] mx-auto flex flex-col gap-6 min-h-screen overflow-x-hidden">
      <div className="page-header">
        <div className="flex items-center text-sm font-medium text-slate-500">
          <span>Portofolio</span>
          <span className="mx-2">›</span>
          <span className="text-primary-600 font-bold">Portofolio Lainnya</span>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Streamlining & Akuisisi
          </h1>
          <p className="text-slate-500 mt-1">
            Pantau progres performa dan dokumen pendukung terkait portofolio
            strategis lainnya.
          </p>
        </div>
      </div>

      {/* Tabs (Apple-style Segmented Control) */}
      <div className="inline-flex bg-slate-100/80 p-1.5 rounded-2xl w-fit self-start shadow-inner">
        <button
          onClick={() => setActiveTab("streamlining")}
          className={`px-6 py-2.5 font-bold text-sm flex items-center gap-2 rounded-xl transition-all duration-300 ${
            activeTab === "streamlining"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Briefcase size={18} />
          Streamlining
        </button>
        <button
          onClick={() => setActiveTab("akuisisi")}
          className={`px-6 py-2.5 font-bold text-sm flex items-center gap-2 rounded-xl transition-all duration-300 ${
            activeTab === "akuisisi"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 size={18} />
          Akuisisi
        </button>
      </div>

      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* S-Curve Chart (Full Width) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 relative h-125 flex flex-col">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-100 rounded-full -z-10 blur-3xl opacity-50"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-100 rounded-full -z-10 blur-3xl opacity-50"></div>
          
          {/* Tombol Update Progres & Periode */}
          <div className="absolute top-6 right-6 z-20 flex gap-2">
            <button
              onClick={() => {
                setPeriodData({
                  start_date: currentProject.start_date || "",
                  end_date: currentProject.end_date || ""
                });
                setIsEditPeriodOpen(true);
              }}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:text-primary-700 hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm flex items-center gap-2"
            >
              <Calendar size={16} />
              Atur Periode
            </button>
            <button
              onClick={() => setIsUpdateProgressOpen(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
            >
              <Edit3 size={16} />
              Update Progres Bulanan
            </button>
          </div>

          <SCurveProgressChart data={sCurveData} />
        </div>

        {/* Project Documents */}
        <ProjectDocumentsTable projectId={projectId} />

        {/* Modal Update Progress */}
        {isUpdateProgressOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsUpdateProgressOpen(false)} 
            />
            <div className="relative z-10 w-full max-w-5xl max-h-[90vh] animate-in zoom-in-95 duration-200 flex flex-col">
              <MonthlyProgressTracker 
                  project={currentProject} 
                  onUpdate={fetchDynamicSCurve} 
                  onClose={() => setIsUpdateProgressOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Modal Atur Periode */}
        {isEditPeriodOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsEditPeriodOpen(false)} 
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="text-primary-600" size={18} />
                  Atur Periode Proyek
                </h3>
                <button
                  onClick={() => setIsEditPeriodOpen(false)}
                  className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSaving(true);
                  try {
                    const { error } = await supabase.from("projects").upsert({
                      id: projectId,
                      nama_proyek: activeTab === "streamlining" ? "Streamlining" : "Akuisisi",
                      divisi: "lainnya",
                      kategori: "lainnya",
                      start_date: periodData.start_date,
                      end_date: periodData.end_date,
                      created_by: "system",
                      progress: currentProject.progress || 0,
                      status: currentProject.status || "Berjalan"
                    });
                    if (error) throw error;
                    
                    setIsEditPeriodOpen(false);
                    fetchProject();
                    alert("Periode proyek berhasil diperbarui!", { severity: "success" });
                  } catch (error: any) {
                    alert("Gagal memperbarui periode: " + error.message, { severity: "danger" });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="p-5 flex flex-col gap-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodData.start_date}
                    onChange={(e) => setPeriodData({ ...periodData, start_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodData.end_date}
                    onChange={(e) => setPeriodData({ ...periodData, end_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditPeriodOpen(false)}
                    className="px-5 py-2.5 font-bold text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 font-bold text-sm text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? <Spinner size="sm" /> : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
