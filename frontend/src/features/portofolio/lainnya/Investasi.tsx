
import { InvestasiBubbleChart } from "@/components/charts";
import { DocumentGallery } from "@/components/shared";
import { useRealtime } from "@/hooks/useRealtime";

// Dummy data since parser is not ready for bubble chart
const DUMMY_INVESTASI = [
  { id: "1", nama: "Proyek Ekspansi Pabrik A", nilai_investasi: 1500, roi_persen: 15.5, risiko_score: 4, status: "aktif" as const },
  { id: "2", nama: "Akuisisi Lahan Tambang B", nilai_investasi: 800, roi_persen: 8.2, risiko_score: 7, status: "prospek" as const },
  { id: "3", nama: "Joint Venture Logistik", nilai_investasi: 2100, roi_persen: 22.0, risiko_score: 8, status: "ditangguhkan" as const },
  { id: "4", nama: "Modernisasi Mesin Produksi", nilai_investasi: 500, roi_persen: 12.0, risiko_score: 2, status: "aktif" as const },
  { id: "5", nama: "Pengembangan R&D Center", nilai_investasi: 300, roi_persen: 5.5, risiko_score: 5, status: "prospek" as const },
];

export default function Investasi() {
  const documents = useRealtime<any>({ table: "documents", filter: { project_id: "investasi-global" } }).records;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Investasi & Portofolio Lainnya</h2>
        <p className="text-sm text-slate-500 mt-1">Peta sebaran portofolio investasi beserta tingkat pengembalian (ROI) dan risiko</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InvestasiBubbleChart data={DUMMY_INVESTASI} />
        </div>
        
        <div className="lg:col-span-1 h-112.5">
          <DocumentGallery 
            documents={documents} 
            onUpload={() => alert("Fitur upload dokumen akan diimplementasi di Modul 07")}
          />
        </div>
      </div>
    </div>
  );
}
