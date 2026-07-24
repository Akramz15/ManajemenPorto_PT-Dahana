import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ExternalLink, Plus, Trash2, Link, FileText, X, Edit2, Save, Download, Search, Eye } from "lucide-react";
import { useDialogStore } from "@/store/dialogStore";
import { Spinner } from "@/components/ui";

interface ProjectDocumentsTableProps {
  projectId: string;
}

export function ProjectDocumentsTable({
  projectId,
}: ProjectDocumentsTableProps) {
  const { session } = useAuth();
  const { confirm, alert } = useDialogStore();
  const currentUserId = session?.user?.id;
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add state
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [docType, setDocType] = useState<"link" | "file">("link");
  const [fileObj, setFileObj] = useState<File | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  // Edit state
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const [editDocUrl, setEditDocUrl] = useState("");
  const [editDocType, setEditDocType] = useState<"link" | "file">("link");
  const [editFileObj, setEditFileObj] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);

    const { data: docsData } = await supabase
      .from("documents")
      .select(`*`)
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });

    if (docsData && docsData.length > 0) {
      const uploaderIds = [
        ...new Set(docsData.map((d) => d.uploaded_by).filter(Boolean)),
      ];

      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", uploaderIds);

        if (profiles) {
          const enrichedDocs = docsData.map((doc) => {
            const profile = profiles.find((p) => p.id === doc.uploaded_by);
            return {
              ...doc,
              user_profiles: profile
                ? { display_name: profile.display_name }
                : null,
            };
          });
          setDocuments(enrichedDocs);
          setLoading(false);
          return;
        }
      }
    }

    setDocuments(docsData || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenLink = async (doc: any) => {
    if (doc.document_type === "link") {
      window.open(doc.document_url, "_blank");
    } else {
      try {
        const { data, error } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(doc.document_url, 60 * 60); // 1 jam
        if (error) throw error;
        if (data?.signedUrl) {
          window.open(data.signedUrl, "_blank");
        }
      } catch (err: any) {
        console.error(err);
        alert("Gagal membuka dokumen: " + err.message, { severity: "danger" });
      }
    }
  };

  const handleDownloadFile = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("project-documents")
        .createSignedUrl(doc.document_url, 60 * 60, { download: doc.file_name }); // 1 jam
      if (error) throw error;
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = doc.file_name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengunduh dokumen: " + err.message, { severity: "danger" });
    }
  };

  const uploadToStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const uniqueName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${projectId}/${uniqueName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    return filePath;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !currentUserId) return;
    if (docType === "link" && !documentUrl) return;
    if (docType === "file" && !fileObj) {
      alert("Harap pilih file untuk diunggah", { severity: "info" });
      return;
    }

    setIsSaving(true);
    try {
      let finalUrl = documentUrl;
      
      if (docType === "link") {
        new URL(documentUrl); // validasi URL
      } else if (docType === "file" && fileObj) {
        finalUrl = await uploadToStorage(fileObj);
      }

      const { error: dbError } = await supabase.from("documents").insert([
        {
          project_id: projectId,
          document_url: finalUrl,
          file_name: fileName,
          document_type: docType,
          uploaded_by: currentUserId,
        },
      ]);

      if (dbError) throw dbError;

      alert("Dokumen berhasil ditambahkan!", { severity: "success" });
      
      // Reset form
      setFileName("");
      setDocumentUrl("");
      setFileObj(null);
      setDocType("link");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsAdding(false);
      
      await fetchDocuments();
    } catch (err: any) {
      console.error(err);
      alert(
        err.message?.includes("URL") || err instanceof TypeError
          ? "Format URL tidak valid. Pastikan dimulai dengan http:// atau https://"
          : "Gagal menambah dokumen: " + err.message,
        { severity: "danger" }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (doc: any) => {
    setEditingDocId(doc.id);
    setEditFileName(doc.file_name);
    setEditDocType(doc.document_type || "link");
    setEditDocUrl(doc.document_url);
    setEditFileObj(null);
  };

  const cancelEdit = () => {
    setEditingDocId(null);
    setEditFileName("");
    setEditDocUrl("");
    setEditDocType("link");
    setEditFileObj(null);
  };

  const handleSaveEdit = async () => {
    if (!editFileName || !editingDocId) return;
    
    setIsUpdating(true);
    try {
      let finalUrl = editDocUrl;
      
      if (editDocType === "link") {
        new URL(editDocUrl);
      } else if (editDocType === "file" && editFileObj) {
        const oldDoc = documents.find(d => d.id === editingDocId);
        
        // Hapus file lama jika sebelumnya tipe file
        if (oldDoc && oldDoc.document_type === "file" && oldDoc.document_url) {
           await supabase.storage.from("project-documents").remove([oldDoc.document_url]);
        }
        
        finalUrl = await uploadToStorage(editFileObj);
      }

      const { error: dbError } = await supabase
        .from("documents")
        .update({
          file_name: editFileName,
          document_url: finalUrl,
          document_type: editDocType,
        })
        .eq("id", editingDocId);

      if (dbError) throw dbError;

      alert("Dokumen berhasil diperbarui!", { severity: "success" });
      cancelEdit();
      await fetchDocuments();
    } catch (err: any) {
      console.error(err);
      alert(
        err.message?.includes("URL") || err instanceof TypeError
          ? "Format URL tidak valid."
          : "Gagal memperbarui dokumen: " + err.message,
        { severity: "danger" }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (doc: any) => {
    if (
      !(await confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.file_name}"?`, {
        severity: "danger",
      }))
    )
      return;

    try {
      // Jika tipenya file, hapus dari storage bucket juga
      if (doc.document_type === "file" && doc.document_url) {
        await supabase.storage.from("project-documents").remove([doc.document_url]);
      }
      
      await supabase.from("documents").delete().eq("id", doc.id);
      await fetchDocuments();
      alert("Dokumen berhasil dihapus!", { severity: "success" });
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus dokumen: " + err.message, { severity: "danger" });
    }
  };

  const renderAddForm = () => (
    <div className="p-6 bg-slate-50 border-b border-slate-100">
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setDocType("link");
            setDocumentUrl("");
          }}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            docType === "link"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Tautan (URL)
        </button>
        <button
          type="button"
          onClick={() => setDocType("file")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            docType === "file"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Unggah File
        </button>
      </div>

      <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Dokumen
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Contoh: Proposal Proyek"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          
          {docType === "link" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tautan (URL)
              </label>
              <input
                type="url"
                required
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih File (Max 10MB)
              </label>
              <input
                type="file"
                required
                ref={fileInputRef}
                onChange={(e) => setFileObj(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setFileName("");
              setDocumentUrl("");
              setFileObj(null);
            }}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              "Simpan Dokumen"
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 gap-4 bg-white">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Link className="text-primary-500" size={18} />
            Dokumen Administratif
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Kelola dokumen dan tautan terkait proyek ini (Upload & Link).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="cursor-pointer px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus size={16} />
            Tambah Dokumen
          </button>
        </div>
      </div>

      {isAdding && renderAddForm()}

      <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 max-h-100">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Nama Dokumen
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">
                Penulis
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Ditambahkan
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center w-32">
                Aksi
              </th>
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
                    <p className="font-bold text-slate-600 text-center">
                      Belum ada dokumen
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-1 max-w-md text-center text-balance mx-auto">
                      Silakan tambahkan dokumen atau tautan eksternal terkait proyek Anda di sini.
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Search size={24} className="text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-600 text-center">
                      Dokumen tidak ditemukan
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-1 max-w-md text-center text-balance mx-auto">
                      Tidak ada dokumen yang cocok dengan kata kunci "{searchQuery}".
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => {
                const isEditing = editingDocId === doc.id;
                const displayName = doc.user_profiles?.display_name || "Tim";
                const firstName = displayName.split(" ")[0];
                const isFile = doc.document_type === "file";

                if (isEditing) {
                  return (
                    <tr key={doc.id} className="bg-blue-50/30">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Judul Dokumen
                              </label>
                              <input
                                type="text"
                                value={editFileName}
                                onChange={(e) => setEditFileName(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                              />
                            </div>
                            
                            {editDocType === "link" ? (
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Tautan (URL)
                                </label>
                                <input
                                  type="url"
                                  value={editDocUrl}
                                  onChange={(e) => setEditDocUrl(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div>
                                <label className="flex text-xs font-bold text-slate-700 mb-1 justify-between">
                                  <span>Ganti File</span>
                                  <span className="text-slate-400 font-normal">Kosongkan jika tidak mengubah</span>
                                </label>
                                <input
                                  type="file"
                                  ref={editFileInputRef}
                                  onChange={(e) => setEditFileObj(e.target.files?.[0] || null)}
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                              <X size={14} /> Batal
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                              {isUpdating ? <Spinner size="sm" /> : <Save size={14} />}
                              Simpan
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isFile 
                            ? "bg-purple-50 text-purple-600" 
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {isFile ? <FileText size={16} /> : <Link size={16} />}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="font-semibold text-slate-700 max-w-40 md:max-w-64 lg:max-w-xs truncate"
                            title={doc.file_name}
                          >
                            {doc.file_name}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                            {isFile ? "Unggahan File" : "Tautan Eksternal"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-600 text-center">
                      <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                        {firstName}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-700 text-xs">
                        {format(new Date(doc.uploaded_at), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {format(new Date(doc.uploaded_at), "HH:mm", {
                          locale: idLocale,
                        })}{" "}
                        WIB
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenLink(doc)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isFile 
                              ? "text-purple-600 hover:bg-purple-50"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                          title={isFile ? "Lihat File" : "Buka Tautan"}
                        >
                          {isFile ? <Eye size={16} /> : <ExternalLink size={16} />}
                        </button>
                        {isFile && (
                          <button
                            onClick={() => handleDownloadFile(doc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Unduh File"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(doc)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Ubah Dokumen"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
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
