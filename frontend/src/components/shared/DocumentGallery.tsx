import {
  ExternalLink,
  Link,
  Trash2,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import type { Document } from "@/types";
import { useDialogStore } from "@/store/dialogStore";

interface DocumentGalleryProps {
  documents: Document[];
  onDelete?: (docId: string) => void;
  projectId?: string;
  onRefresh?: () => void;
}

export function DocumentGallery({
  documents,
  onDelete,
  projectId,
  onRefresh,
}: DocumentGalleryProps) {
  const { user } = useAuth();
  const { alert, confirm } = useDialogStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank");
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !documentUrl || !projectId || !user) return;

    setIsSaving(true);
    try {
      new URL(documentUrl);

      const { error: dbError } = await supabase.from("documents").insert({
        project_id: projectId,
        file_name: fileName,
        document_url: documentUrl,
        document_type: "link",
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      alert("Tautan dokumen berhasil ditambahkan!", { severity: "success" });
      setFileName("");
      setDocumentUrl("");
      setIsAdding(false);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error("Add link error:", error);
      alert(
        error.message?.includes("URL") || error instanceof TypeError
          ? "Format URL tidak valid. Pastikan dimulai dengan http:// atau https://"
          : "Gagal menambah tautan: " + error.message,
        {
          severity: "danger",
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (
      !(await confirm("Apakah Anda yakin ingin menghapus tautan dokumen ini?", {
        severity: "danger",
      }))
    )
      return;

    try {
      await supabase.from("documents").delete().eq("id", docId);
      alert("Tautan dokumen berhasil dihapus!", { severity: "success" });
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert("Gagal menghapus tautan: " + error.message, {
        severity: "danger",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Dokumen Tautan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Arsip tautan cloud storage project
          </p>
        </div>
        <button className="text-sm font-bold text-primary-600 hover:text-primary-700">
          Lihat Semua
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {projectId && (
          <div className="w-full">
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100 mb-3 text-primary-600 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Tambah Tautan Dokumen
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Google Drive, OneDrive, DropBox, dll.
                </p>
              </button>
            ) : (
              <form
                onSubmit={handleAddLink}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Dokumen
                  </label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Contoh: Dokumen Kajian Final"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan / URL
                  </label>
                  <input
                    type="url"
                    required
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Tautan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {!documents.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <Link size={28} className="opacity-40" />
            <p className="text-xs font-medium">
              Belum ada tautan yang ditambahkan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex items-center p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border bg-blue-50 text-blue-600 border-blue-100 mr-4">
                  <Link size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-bold text-slate-800 truncate"
                    title={doc.file_name}
                  >
                    {doc.file_name}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {formatDistanceToNow(new Date(doc.uploaded_at), {
                      locale: id,
                      addSuffix: false,
                    }).toUpperCase()}
                  </p>
                </div>

                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                  <button
                    onClick={() => handleOpenLink(doc.document_url)}
                    className="p-1.5 rounded-md hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                    title="Buka Tautan"
                  >
                    <ExternalLink size={14} />
                  </button>
                  {(onDelete || projectId) && (
                    <button
                      onClick={() => {
                        if (projectId) handleDeleteDocument(doc.id);
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
