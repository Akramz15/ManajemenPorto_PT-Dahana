import { useDropzone } from "react-dropzone";
import { apiClient } from "@/lib/api";
import { useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { Spinner } from "@/components/ui";

interface ExcelUploaderProps {
  context: string;
  subContext?: string;
  onSuccess: (data: unknown) => void;
}

export function ExcelUploader({ context, subContext, onSuccess }: ExcelUploaderProps) {
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

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-40
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
