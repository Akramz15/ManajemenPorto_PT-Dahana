# Modul 05 — Modul Pengembangan Usaha

## 1. Overview

Modul Pengembangan Usaha terdiri dari dua divisi dengan SOP identik:
- **Divisi Komersial** → project komersial PT Dahana
- **Divisi Pertahanan** → project bidang pertahanan

Setiap divisi memiliki dua sub-menu:
1. **Project Berjalan** — Kurva S + Dokumen + Progress Tracking
2. **Project Kajian** — Collaborative Progress Tracking saja

---

## 2. Project Berjalan — Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Project Selector Dropdown]  [Upload Excel] [Manage Docs]   │
├──────────────────────────────────────────────────────────────┤
│  KURVA S CHART (full width, area chart)                       │
│                                                               │
│  Rencana ─── | Realisasi ───                                 │
│                                                               │
│  Tooltip: Periode: Okt 2024 | Rencana: 45.2% | Realisasi:   │
│           38.7% | Deviasi: -6.5%                             │
├──────────────────────────────────────────────────────────────┤
│  DOKUMEN ADMINISTRATIF              │  PROGRESS TRACKING      │
│                                     │                         │
│  [File Card] [File Card] [+]        │  [User 1] ██████ Done  │
│  Klik untuk download                │  [User 2] ████── 75%   │
│                                     │  [User 3] ██──── 40%   │
│                                     │  [User 4] ─────── 0%   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Kurva S Component

### 3.1 Upload Excel Flow
```typescript
// src/components/shared/ExcelUploader.tsx
import { useDropzone } from "react-dropzone";
import { apiClient } from "@/lib/api";
import { useState } from "react";

interface ExcelUploaderProps {
  context: string;
  onSuccess: (data: unknown) => void;
}

export function ExcelUploader({ context, onSuccess }: ExcelUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", files[0]);
        const res = await apiClient.post(`/api/v1/extract/${context}`, formData);
        onSuccess(res.data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Gagal memproses file";
        setError(msg);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary-400 bg-primary-50" : "border-slate-200 hover:border-primary-300"}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <p className="text-sm text-slate-500">Memproses...</p>
      ) : (
        <p className="text-sm text-slate-500">
          Drag & drop file Excel, atau klik untuk pilih
        </p>
      )}
      {error && <p className="text-xs text-negative-500 mt-2">{error}</p>}
    </div>
  );
}
```

### 3.2 Kurva S Chart Component
```typescript
// src/components/charts/KurvaSChart.tsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface KurvaSDataPoint {
  periode: string;
  rencana: number;
  realisasi: number;
}

interface KurvaSChartProps {
  data: KurvaSDataPoint[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const rencana = payload.find((p) => p.name === "rencana");
  const realisasi = payload.find((p) => p.name === "realisasi");
  const deviasi = realisasi && rencana
    ? (realisasi.value - rencana.value).toFixed(1)
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card-hover p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-2">{label}</p>
      <p className="text-primary-600">Rencana: <span className="font-bold">{rencana?.value}%</span></p>
      <p className="text-positive-600">Realisasi: <span className="font-bold">{realisasi?.value}%</span></p>
      {deviasi && (
        <p className={parseFloat(deviasi) >= 0 ? "text-positive-600" : "text-negative-600"}>
          Deviasi: <span className="font-bold">{deviasi}%</span>
        </p>
      )}
    </div>
  );
}

export function KurvaSChart({ data }: KurvaSChartProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Kurva S — Progres Proyek</h3>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRencana" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="rencana"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorRencana)"
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="realisasi"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#colorRealisasi)"
            dot={false}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 4. Document Gallery Component

```typescript
// src/components/shared/DocumentGallery.tsx
import { Download, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  storage_path: string;
}

interface DocumentGalleryProps {
  documents: Document[];
  onDelete?: (id: string) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function DocumentGallery({ documents, onDelete }: DocumentGalleryProps) {
  const handleDownload = async (path: string, name: string) => {
    const { data } = await supabase.storage
      .from("project-documents")
      .download(path);
    if (!data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!documents.length) {
    return (
      <div className="card flex flex-col items-center justify-center py-10 text-slate-400">
        <FileText size={32} className="mb-2 opacity-40" />
        <p className="text-sm">Belum ada dokumen</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Dokumen Administratif</h3>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg
                       hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                <FileText size={14} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{doc.file_name}</p>
                <p className="text-xs text-slate-400">
                  {formatBytes(doc.file_size)} ·{" "}
                  {formatDistanceToNow(new Date(doc.uploaded_at), { locale: id, addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                className="p-1.5 rounded-md hover:bg-primary-100 text-slate-500 hover:text-primary-600 transition-colors"
              >
                <Download size={14} />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(doc.id)}
                  className="p-1.5 rounded-md hover:bg-negative-100 text-slate-500 hover:text-negative-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Progress Tracker Component

```typescript
// src/components/shared/ProgressTracker.tsx
import { useRealtime } from "@/hooks/useRealtime";

type TaskStatus = "not_started" | "in_progress" | "done" | "blocked";

interface ProgressTask {
  id: string;
  title: string;
  status: TaskStatus;
  assigned_to: string;
  user_profiles: { display_name: string; avatar_url?: string };
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; progress: number }> = {
  not_started: { label: "Belum Mulai", color: "bg-slate-200", progress: 0 },
  in_progress: { label: "Sedang Berjalan", color: "bg-primary-400", progress: 50 },
  done: { label: "Selesai", color: "bg-positive-500", progress: 100 },
  blocked: { label: "Terhambat", color: "bg-negative-500", progress: 0 },
};

interface ProgressTrackerProps {
  projectId: string;
  tasks: ProgressTask[];
  currentUserId: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export function ProgressTracker({ tasks, currentUserId, onStatusChange }: ProgressTrackerProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Progress Tim</h3>
      <div className="space-y-4">
        {tasks.map((task) => {
          const config = STATUS_CONFIG[task.status];
          const isOwner = task.assigned_to === currentUserId;

          return (
            <div key={task.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {task.user_profiles.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {task.user_profiles.display_name}
                    </p>
                    <p className="text-xs text-slate-500">{task.title}</p>
                  </div>
                </div>
                {isOwner ? (
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white
                               focus:outline-none focus:ring-1 focus:ring-primary-400"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${task.status === "done" ? "bg-positive-100 text-positive-700" :
                      task.status === "blocked" ? "bg-negative-100 text-negative-700" :
                      task.status === "in_progress" ? "bg-primary-100 text-primary-700" :
                      "bg-slate-100 text-slate-600"}`}>
                    {config.label}
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.color}`}
                  style={{ width: `${config.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 6. Project Kajian (Simplified)

```typescript
// src/features/pengembangan-usaha/komersial/ProjectKajian.tsx
import { KajianTimeline } from "@/components/shared/KajianTimeline";
import { useRealtime } from "@/hooks/useRealtime";

export default function ProjectKajian() {
  const tasks = useRealtime("kajian_tasks", { divisi: "komersial" });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Project Kajian — Komersial</h2>
        <p className="text-sm text-slate-500 mt-0.5">Pantau tahapan kajian seluruh anggota tim</p>
      </div>
      <KajianTimeline tasks={tasks} divisi="komersial" />
    </div>
  );
}
```

---

## 📌 Prompt AI — Modul 05

```
Bangun Modul Pengembangan Usaha untuk Dahana BizPort.

Fitur yang dibutuhkan:
1. ExcelUploader component (react-dropzone) yang POST ke /api/v1/extract/kurva-s
2. KurvaSChart component (Recharts AreaChart) dengan:
   - Dua area: "rencana" (biru) dan "realisasi" (hijau)
   - CustomTooltip menampilkan nilai pasti + deviasi
   - Gradient fill di bawah garis
3. DocumentGallery component untuk tampil daftar file + download dari Supabase Storage
4. ProgressTracker component dengan:
   - List task per user
   - Progress bar animasi
   - Dropdown status hanya untuk task milik user yang sedang login
   - Real-time update via Supabase Realtime
5. Halaman ProjectBerjalan.tsx yang menggabungkan semua komponen di atas
6. Halaman ProjectKajian.tsx hanya menampilkan KajianTimeline

Gunakan TailwindCSS untuk styling.
Kode harus production-ready tanpa komentar redundan.
```
