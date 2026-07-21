import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { SCurveProgressChart } from "./SCurveProgressChart";
import { Save, Edit2 } from "lucide-react";
import { useDialogStore } from "@/store/dialogStore";
import { Spinner } from "@/components/ui";

interface KurvaSManagerProps {
  projectId: string;
}

const BULAN_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function KurvaSManager({ projectId }: KurvaSManagerProps) {
  const { alert } = useDialogStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for editing
  const [editData, setEditData] = useState<{
    [bulan: number]: {
      id?: string;
      bobot_rencana_persen: number | string;
      bobot_realisasi_persen: number | string | null;
    };
  }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: records, error } = await supabase
        .from("kurva_s_manual")
        .select("*")
        .eq("project_id", projectId)
        .order("bulan", { ascending: true });

      if (error) throw error;

      setData(records || []);

      // Initialize edit state with 1-12 months
      const initialEdit: any = {};
      for (let i = 1; i <= 12; i++) {
        const record = records?.find((r) => r.bulan === i);
        initialEdit[i] = {
          id: record?.id,
          bobot_rencana_persen: record ? record.bobot_rencana_persen : 0,
          bobot_realisasi_persen: record ? record.bobot_realisasi_persen : "",
        };
      }
      setEditData(initialEdit);
    } catch (err: any) {
      console.error(err);
      alert("Gagal memuat data Kurva S: " + err.message, {
        severity: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, alert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const upsertPayload = [];
      for (let i = 1; i <= 12; i++) {
        const item = editData[i];
        upsertPayload.push({
          ...(item.id ? { id: item.id } : {}),
          project_id: projectId,
          nama_pekerjaan: "General Progress",
          bulan: i,
          bobot_rencana_persen: Number(item.bobot_rencana_persen) || 0,
          bobot_realisasi_persen:
            item.bobot_realisasi_persen === "" ||
            item.bobot_realisasi_persen === null
              ? null
              : Number(item.bobot_realisasi_persen),
        });
      }

      const { error } = await supabase
        .from("kurva_s_manual")
        .upsert(upsertPayload);

      if (error) throw error;

      alert("Data Kurva S berhasil disimpan!", { severity: "success" });
      setIsEditing(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan data: " + err.message, { severity: "danger" });
    } finally {
      setIsSaving(false);
    }
  };

  // Convert for SCurveProgressChart
  const chartData = [];
  for (let i = 1; i <= 12; i++) {
    const record = data.find((r) => r.bulan === i);
    chartData.push({
      periode: BULAN_NAMES[i - 1],
      rencana: record ? record.bobot_rencana_persen : null,
      realisasi: record ? record.bobot_realisasi_persen : null,
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-8 flex flex-col h-full">
      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Visualisasi Kurva S</h3>
        </div>
        <div className="flex-1 min-h-75 relative">
          <SCurveProgressChart data={chartData} />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">
            Data Bulanan (Target & Realisasi)
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Edit2 size={16} />
              Edit Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchData(); // reset edits
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                {isSaving ? <Spinner size="sm" /> : <Save size={16} />}
                Simpan
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-xs w-32">
                  Bulan
                </th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-xs">
                  Target / Rencana (%)
                </th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-xs">
                  Realisasi (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {BULAN_NAMES.map((bulan, idx) => {
                const monthNum = idx + 1;
                return (
                  <tr key={monthNum} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {bulan}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editData[monthNum]?.bobot_rencana_persen ?? ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              [monthNum]: {
                                ...prev[monthNum],
                                bobot_rencana_persen: e.target.value,
                              },
                            }))
                          }
                          className="w-full max-w-37.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      ) : (
                        <span className="font-medium text-slate-600">
                          {editData[monthNum]?.bobot_rencana_persen ?? 0}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            editData[monthNum]?.bobot_realisasi_persen ?? ""
                          }
                          placeholder="Belum ada"
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              [monthNum]: {
                                ...prev[monthNum],
                                bobot_realisasi_persen: e.target.value,
                              },
                            }))
                          }
                          className="w-full max-w-37.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      ) : (
                        <span
                          className={`font-bold ${editData[monthNum]?.bobot_realisasi_persen !== "" && editData[monthNum]?.bobot_realisasi_persen !== null ? "text-primary-600" : "text-slate-400"}`}
                        >
                          {editData[monthNum]?.bobot_realisasi_persen !== "" &&
                          editData[monthNum]?.bobot_realisasi_persen !== null
                            ? `${editData[monthNum]?.bobot_realisasi_persen}%`
                            : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
