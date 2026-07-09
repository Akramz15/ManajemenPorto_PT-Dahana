export default function Investasi() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-125">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Investasi & Portofolio Lainnya</h2>
        <p className="text-sm text-slate-500 mt-1">Peta sebaran portofolio investasi beserta tingkat pengembalian (ROI) dan risiko</p>
      </div>

      <div className="card w-full min-h-125 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Coming Soon</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Fitur analisis portofolio investasi dan afiliasi sedang dalam tahap pengembangan. Silakan nantikan pembaruan berikutnya dari tim kami.
        </p>
      </div>
    </div>
  );
}
