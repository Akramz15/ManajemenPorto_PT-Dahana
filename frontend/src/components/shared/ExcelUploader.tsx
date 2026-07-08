import { useDropzone } from "react-dropzone";
import { apiClient } from "@/lib/api";
import { useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { Spinner } from "@/components/ui";

interface ExcelUploaderProps {
  context: string;
  subContext?: string;
  compact?: boolean;
  onSuccess: (data: unknown) => void;
}

export function ExcelUploader({ context, subContext, compact = false, onSuccess }: ExcelUploaderProps) {
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
        let url = `/api/v1/extract/${context}`;
        if (subContext) {
          url += `?sub_context=${encodeURIComponent(subContext)}`;
        }
        const res = await apiClient.post(url, formData);
        onSuccess(res.data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Gagal memproses file";
        setError(msg);
      } finally {
        setUploading(false);
      }
    },
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 flex items-center gap-4 min-h-18
          ${isDragActive ? "border-primary-500 bg-primary-50 scale-[0.98]" : "border-slate-300 hover:border-primary-400 hover:bg-slate-50 hover:shadow-sm"}`}
      >
        <input {...getInputProps()} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0
          ${isDragActive ? "bg-primary-200 text-primary-700" : "bg-slate-100 text-slate-500"}`}>
          {uploading ? <Spinner size="sm" className="text-primary-500" /> : (isDragActive ? <UploadCloud size={20} /> : <FileSpreadsheet size={20} />)}
        </div>
        <div className="text-left flex-1">
          {uploading ? (
             <p className="text-sm font-bold text-slate-700">Memproses...</p>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-700 leading-tight">Update Data</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5 whitespace-nowrap">Drop Excel di sini</p>
            </>
          )}
          {error && <p className="text-[10px] text-negative-600 font-bold mt-1 leading-tight">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`p-4 rounded-xl border-2 border-dashed transition-all duration-300 min-h-36 flex flex-col items-center justify-center text-center
        ${isDragActive ? "border-primary-400 bg-primary-50 scale-[0.99]" : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <Spinner size="md" className="text-primary-500" />
          <p className="text-sm font-medium text-slate-600 mt-2">Memproses File Excel...</p>
        </>
      ) : (
        <>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
            ${isDragActive ? "bg-primary-200 text-primary-700" : "bg-slate-100 text-slate-400"}`}>
            {isDragActive ? <UploadCloud size={24} /> : <FileSpreadsheet size={24} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Drag & drop file Excel ke sini
            </p>
            <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file</p>
          </div>
        </>
      )}
      {error && (
        <div className="bg-negative-50 text-negative-700 text-xs px-3 py-2 rounded-lg mt-2 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
