import { useState } from "react";
import { KurvaSManager } from "@/components/charts";
import { DocumentGallery } from "@/components/shared";
import { Briefcase, Building2 } from "lucide-react";

export default function PortofolioLainnya() {
  const [activeTab, setActiveTab] = useState<"streamlining" | "akuisisi">(
    "streamlining",
  );

  return (
    <div className="px-6 pt-0 pb-6 max-w-[1600px] mx-auto flex flex-col gap-6 min-h-screen">
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

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <KurvaSManager 
          projectId={`porto-lainnya-${activeTab}`}
          rightContent={
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-full min-h-125">
              <DocumentGallery
                documents={[]}
                projectId={`porto-lainnya-${activeTab}`}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
