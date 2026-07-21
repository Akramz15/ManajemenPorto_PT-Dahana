import { useState } from "react";
import { KurvaSManager } from "@/components/charts";
import { DocumentGallery } from "@/components/shared";
import { Briefcase, Building2 } from "lucide-react";

export default function PortofolioLainnya() {
  const [activeTab, setActiveTab] = useState<"streamlining" | "akuisisi">(
    "streamlining",
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      <div className="page-header mb-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Left Column: S-Curve */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 min-h-125 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
              Kurva S & Input Progress
            </h3>
            <div className="flex-1 relative flex flex-col min-h-0">
              <KurvaSManager projectId={`porto-lainnya-${activeTab}`} />
            </div>
          </div>
        </div>

        {/* Right Column: Documents */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 min-h-125 flex flex-col">
            <DocumentGallery
              documents={[]}
              projectId={`porto-lainnya-${activeTab}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
