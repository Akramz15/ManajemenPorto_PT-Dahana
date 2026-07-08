import { Download, FileText, Trash2, CloudUpload, File, FileSpreadsheet, FileImage } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { formatFileSize } from "@/lib/formatters";
import type { Document } from "@/types";

interface DocumentGalleryProps {
  documents: Document[];
  onDelete?: (docId: string) => void;
  onUpload?: () => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <FileText size={24} className="text-negative-600" />;
    case 'docx':
    case 'doc':
      return <File size={24} className="text-primary-600" />;
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet size={24} className="text-positive-600" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <FileImage size={24} className="text-negative-500" />;
    default:
      return <FileText size={24} className="text-slate-500" />;
  }
};

const getFileColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'bg-negative-50 text-negative-600 border-negative-100';
    case 'docx':
    case 'doc': return 'bg-primary-50 text-primary-600 border-primary-100';
    case 'xlsx':
    case 'xls': return 'bg-positive-50 text-positive-600 border-positive-100';
    case 'png':
    case 'jpg':
    case 'jpeg': return 'bg-negative-50 text-negative-500 border-negative-100';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

export function DocumentGallery({ documents, onDelete, onUpload }: DocumentGalleryProps) {
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Dokumen Administratif</h3>
          <p className="text-xs text-slate-500 mt-0.5">Arsip file teknis & legalitas project</p>
        </div>
        <button className="text-sm font-bold text-primary-600 hover:text-primary-700">Lihat Semua</button>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {/* Upload Dropzone */}
        {onUpload && (
          <div 
            onClick={onUpload}
            className="w-full rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 hover:bg-primary-50 transition-colors cursor-pointer flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100 mb-3 text-primary-600">
              <CloudUpload size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Tarik file ke sini untuk mengunggah</h4>
            <p className="text-[11px] text-slate-500 font-medium">Mendukung PDF, DOCX, XLSX (Maks. 25MB)</p>
          </div>
        )}

        {/* Document Grid */}
        {!documents.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <FileText size={28} className="opacity-40" />
            <p className="text-xs font-medium">Belum ada dokumen yang diunggah.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex items-center p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getFileColor(doc.file_name)} mr-4`}>
                  {getFileIcon(doc.file_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {formatDistanceToNow(new Date(doc.uploaded_at), { locale: id, addSuffix: false }).toUpperCase()} • {formatFileSize(doc.file_size)}
                  </p>
                </div>
                
                {/* Actions Hover */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                  <button
                    onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                    className="p-1.5 rounded-md hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 rounded-md hover:bg-negative-50 text-slate-400 hover:text-negative-600 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
