import { useState, useCallback, useEffect } from "react";
import { Briefcase, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SCurveProgressChart } from "@/components/charts";
import { MonthlyProgressTracker, ProjectDocumentsTable } from "@/components/shared";
import type { Project } from "@/types/api.types";

export default function PortofolioLainnya() {
  const [activeTab, setActiveTab] = useState<"streamlining" | "akuisisi">(
    "streamlining",
  );
  const [sCurveData, setSCurveData] = useState<any[]>([]);

  const projectId = `porto-lainnya-${activeTab}`;
  
  // Mock project so we can reuse the MonthlyProgressTracker component
  const mockProject: Project = {
    id: projectId,
    nama_proyek: activeTab === "streamlining" ? "Streamlining" : "Akuisisi",
    start_date: `${new Date().getFullYear()}-01-01`,
    end_date: `${new Date().getFullYear()}-12-31`,
    divisi: "komersial", // dummy
    kategori: "berjalan", // dummy
    mitra: null,
    nilai_kontrak: null,
    created_by: "system",
    created_at: new Date().toISOString(),
  };

  const fetchDynamicSCurve = useCallback(async () => {
    const { data: progressData } = await supabase
      .from("project_progress_activities")
      .select("*")
      .eq("project_id", projectId)
      .order("year", { ascending: true })
      .order("month", { ascending: true });

    const start = new Date(new Date().getFullYear(), 0, 1);
    const totalMonths = 12;
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
  }, [projectId]);

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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("streamlining")}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "streamlining"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Briefcase size={18} />
          Streamlining
        </button>
        <button
          onClick={() => setActiveTab("akuisisi")}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "akuisisi"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
          <SCurveProgressChart data={sCurveData} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly Progress Tracker */}
          <MonthlyProgressTracker
            project={mockProject}
            onUpdate={fetchDynamicSCurve}
          />

          {/* Project Documents */}
          <ProjectDocumentsTable projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
