import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { formatRupiah } from "@/lib/formatters";

interface InvestasiItem {
  id: string;
  nama: string;
  nilai_investasi: number;
  roi_persen: number;
  risiko_score: number;
  status: "aktif" | "prospek" | "ditangguhkan";
}

const STATUS_COLORS: Record<string, string> = {
  aktif: "#10B981",
  prospek: "#3B82F6",
  ditangguhkan: "#94A3B8",
};

const STATUS_LABELS: Record<string, string> = {
  aktif: "Aktif",
  prospek: "Prospek",
  ditangguhkan: "Ditangguhkan",
};

function InvestasiTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: InvestasiItem }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-card-hover p-4 text-xs min-w-50">
      <p className="font-bold text-slate-900 mb-2 pb-2 border-b border-slate-100">{item.nama}</p>
      <div className="space-y-1.5">
        <p className="text-slate-600 flex justify-between">
          <span>Nilai Investasi</span>
          <span className="font-bold text-slate-800">{formatRupiah(item.nilai_investasi)}</span>
        </p>
        <p className="text-slate-600 flex justify-between">
          <span>ROI</span>
          <span className="font-bold text-positive-600">{item.roi_persen}%</span>
        </p>
        <p className="text-slate-600 flex justify-between">
          <span>Skor Risiko</span>
          <span className="font-bold text-negative-600">{item.risiko_score} / 10</span>
        </p>
      </div>
      <div className="mt-3 pt-2 border-t border-slate-100 text-right">
        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
          ${item.status === "aktif" ? "bg-positive-50 text-positive-700" :
            item.status === "prospek" ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-600"}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>
    </div>
  );
}

export function InvestasiBubbleChart({ data }: { data: InvestasiItem[] }) {
  // Add a little padding to the axes domain
  return (
    <div className="card w-full">
      <h3 className="text-sm font-bold text-slate-800 mb-1">Peta Portofolio Investasi</h3>
      <p className="text-xs text-slate-500 mb-6">Sebaran investasi berdasarkan ROI dan Skor Risiko (Ukuran bubble = Nilai Investasi)</p>
      
      <div className="w-full h-90">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="roi_persen" 
              name="ROI" 
              unit="%" 
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              axisLine={false} 
              tickLine={false}
              label={{ value: 'Return on Investment (ROI)', position: 'bottom', offset: 0, fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis 
              type="number" 
              dataKey="risiko_score" 
              name="Risiko" 
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              axisLine={false} 
              tickLine={false}
              label={{ value: 'Skor Risiko (1-10)', angle: -90, position: 'left', fontSize: 11, fill: "#94a3b8" }}
            />
            <ZAxis 
              type="number" 
              dataKey="nilai_investasi" 
              range={[100, 2500]} 
              name="Nilai" 
            />
            <Tooltip content={<InvestasiTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Investasi" data={data}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status]} 
                  opacity={0.8}
                  stroke={STATUS_COLORS[entry.status]}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] }}></div>
            <span className="text-xs font-medium text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
