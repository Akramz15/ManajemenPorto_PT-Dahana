import { Download, FileText, Trash2, CloudUpload, File, FileSpreadsheet, FileImage } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { formatFileSize } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useRef, useState } from "react";
import type { Document } from "@/types";

interface DocumentGalleryProps {
  documents: Document[];
  onDelete?: (docId: string) => void;
  onUpload?: () => void;
  projectId?: string;
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

export function DocumentGallery({ documents, onDelete, onUpload, projectId }: DocumentGalleryProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId || !user) return;

    // Validasi ukuran file maks 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      alert("Ukuran file terlalu besar! Maksimal 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const storagePath = `${projectId}/${fileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Insert record to documents table
      const { error: dbError } = await supabase.from("documents").insert({
        project_id: projectId,
        file_name: file.name,
        file_size: file.size,
        storage_path: storagePath,
        uploaded_by: user.id
      });

      if (dbError) throw dbError;
      
      alert("Dokumen berhasil diunggah!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Gagal mengunggah dokumen: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClickUpload = () => {
    if (projectId) {
      fileInputRef.current?.click();
    } else if (onUpload) {
      onUpload();
    }
  };

  const handleDeleteDocument = async (docId: string, storagePath: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    
    try {
      // Hapus dari Storage
      await supabase.storage.from("project-documents").remove([storagePath]);
      
      // Hapus dari database
      await supabase.from("documents").delete().eq("id", docId);
      
    } catch (error: any) {
      console.error("Delete error:", error);
      alert("Gagal menghapus dokumen: " + error.message);
    }
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
        {(onUpload || projectId) && (
          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            <div 
              onClick={isUploading ? undefined : handleClickUpload}
              className={`w-full rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center p-6 text-center ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100 mb-3 text-primary-600">
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                ) : (
                  <CloudUpload size={24} />
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">{isUploading ? 'Sedang Mengunggah...' : 'Tarik file ke sini untuk mengunggah'}</h4>
              <p className="text-[11px] text-slate-500 font-medium">Mendukung PDF, DOCX, XLSX, JPG, PNG (Maks. 10MB)</p>
            </div>
          </>
        )}

        {/* Document Grid */}
        {!documents.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <FileText size={28} className="opacity-40" />
            <p className="text-xs font-medium">Belum ada dokumen yang diunggah.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
                  {(onDelete || projectId) && (
                    <button
                      onClick={() => {
                        if (projectId) handleDeleteDocument(doc.id, doc.storage_path);
                        else if (onDelete) onDelete(doc.id);
                      }}
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
