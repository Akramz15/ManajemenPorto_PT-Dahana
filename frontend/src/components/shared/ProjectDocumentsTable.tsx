import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Download, Upload, Trash2, FileText } from "lucide-react";
import { Spinner } from "@/components/ui";

interface ProjectDocumentsTableProps {
  projectId: string;
}

export function ProjectDocumentsTable({ projectId }: ProjectDocumentsTableProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    
    // Fetch documents
    const { data: docsData } = await supabase
      .from("project_documents")
      .select(`*`)
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });
      
    if (docsData && docsData.length > 0) {
      // Get unique uploader IDs
      const uploaderIds = [...new Set(docsData.map(d => d.uploaded_by).filter(Boolean))];
      
      if (uploaderIds.length > 0) {
        // Fetch matching profiles
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", uploaderIds);
          
        if (profiles) {
          // Map profiles to documents
          const enrichedDocs = docsData.map(doc => {
            const profile = profiles.find(p => p.id === doc.uploaded_by);
            return {
              ...doc,
              user_profiles: profile ? { display_name: profile.display_name } : null
            };
          });
          setDocuments(enrichedDocs);
          setLoading(false);
          return;
        }
      }
    }
    
    // Fallback if no profiles or empty data
    setDocuments(docsData || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    
    setUploading(true);
    try {
      const filePath = `${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("project-documents").upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("project_documents").insert([{
        project_id: projectId,
        storage_path: filePath,
        file_name: file.name,
        uploaded_by: currentUserId
      }]);

      if (dbError) throw dbError;

      alert("Dokumen berhasil diunggah!");
      await fetchDocuments();
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengunggah dokumen: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("project-documents").download(path);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengunduh dokumen: " + err.message);
    }
  };

  const handleDelete = async (docId: string, path: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    
    try {
      await supabase.storage.from("project-documents").remove([path]);
      await supabase.from("project_documents").delete().eq("id", docId);
      await fetchDocuments();
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus dokumen: " + err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 gap-4 bg-white">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-primary-500" size={18} />
            Dokumen Administratif
          </h3>
          <p className="text-xs text-slate-500 mt-1">Kelola seluruh dokumen terkait proyek ini.</p>
        </div>
        
        <div>
          <input 
            type="file" 
            id={`file-upload-${projectId}`}
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <label 
            htmlFor={`file-upload-${projectId}`}
            className={`cursor-pointer px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 flex items-center gap-2 ${uploading ? 'opacity-70 pointer-events-none hover:translate-y-0 hover:shadow-none' : ''}`}
          >
            {uploading ? <Spinner size="sm" className="text-white" /> : <Upload size={16} />}
            {uploading ? "Mengunggah..." : "Upload Dokumen Baru"}
          </label>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nama File</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Uploader</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-slate-700 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <Spinner className="mx-auto text-primary-500" />
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <FileText size={24} className="text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-600">Belum ada dokumen</p>
                    <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs">Silakan unggah dokumen PDF atau teks terkait proyek Anda di sini.</p>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map(doc => {
                const displayName = doc.user_profiles?.display_name || "Tim";
                const firstName = displayName.split(" ")[0];
                
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <span className="font-semibold text-slate-700 max-w-50 md:max-w-75 lg:max-w-100 truncate" title={doc.file_name}>{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-600 text-center">
                      <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                        {firstName}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-700 text-xs">{format(new Date(doc.uploaded_at), "dd MMM yyyy", { locale: id })}</p>
                      <p className="text-[10px] font-medium text-slate-400">{format(new Date(doc.uploaded_at), "HH:mm", { locale: id })} WIB</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Unduh Dokumen"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id, doc.storage_path)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Dokumen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
