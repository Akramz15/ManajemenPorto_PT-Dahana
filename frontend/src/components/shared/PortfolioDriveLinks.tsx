import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Link2, ExternalLink, Plus, Trash2, Edit2, X, Link } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import type { PortfolioLink } from "@/types/api.types";
import { useDialogStore } from "@/store/dialogStore";

interface PortfolioDriveLinksProps {
  context: string; // e.g. "kan", "dic", "jodb", "jodd"
}

export function PortfolioDriveLinks({ context }: PortfolioDriveLinksProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<PortfolioLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { confirm, alert } = useDialogStore();

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("portfolio_links")
        .select("*")
        .eq("portfolio_type", context)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    if (isOpen) {
      fetchLinks();
    }
  }, [isOpen, fetchLinks]);

  const resetForm = () => {
    setNewTitle("");
    setNewUrl("");
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    // Basic URL validation
    let finalUrl = newUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("portfolio_links")
          .update({
            title: newTitle.trim(),
            url: finalUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingId);

        if (error) throw error;
        alert("Tautan berhasil diperbarui!", { severity: "success" });
      } else {
        const { error } = await supabase
          .from("portfolio_links")
          .insert({
            portfolio_type: context,
            title: newTitle.trim(),
            url: finalUrl
          });

        if (error) throw error;
        alert("Tautan berhasil ditambahkan!", { severity: "success" });
      }
      
      resetForm();
      fetchLinks();
    } catch (error: any) {
      alert(`Gagal menyimpan tautan: ${error.message}`, { severity: "danger" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = await confirm(`Hapus tautan "${title}"?`, { severity: "danger" });
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from("portfolio_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("Tautan berhasil dihapus!", { severity: "success" });
      fetchLinks();
    } catch (error: any) {
      alert(`Gagal menghapus tautan: ${error.message}`, { severity: "danger" });
    }
  };

  const handleEdit = (link: PortfolioLink) => {
    setEditingId(link.id);
    setNewTitle(link.title);
    setNewUrl(link.url);
    setIsAdding(true);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary-600 hover:border-primary-200 rounded-xl font-bold text-sm transition-all shadow-sm group"
      >
        <Link2 size={18} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
        Tautan Eksternal
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Link size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                    Tautan Eksternal
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Kelola akses cepat dokumen atau web (Portofolio: {context.toUpperCase()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 sm:p-6 custom-scrollbar">
              
              {!isAdding && (
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 hover:-translate-y-0.5"
                  >
                    <Plus size={16} /> Tambah Tautan
                  </button>
                </div>
              )}

              {isAdding && (
                <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm mb-6 animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-slate-700 mb-4">{editingId ? 'Edit Tautan' : 'Tambah Tautan Baru'}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Tautan</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Laporan Keuangan 2026"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL (Tautan Drive/Web)</label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving || !newTitle.trim() || !newUrl.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                      >
                        {isSaving && <Spinner className="w-4 h-4" />}
                        Simpan
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="flex justify-center p-12">
                  <Spinner className="w-8 h-8 text-indigo-500" />
                </div>
              ) : links.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Link2 size={28} className="text-slate-300" />
                  </div>
                  <h3 className="text-slate-700 font-bold mb-1">Belum ada Tautan</h3>
                  <p className="text-sm text-slate-500 max-w-sm mb-6">
                    Anda belum menambahkan tautan Drive atau dokumen eksternal untuk portofolio ini.
                  </p>
                  {!isAdding && (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="text-indigo-600 font-bold text-sm hover:text-indigo-700"
                    >
                      + Tambah Tautan Pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {links.map((link) => (
                    <div key={link.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate pr-2" title={link.title}>
                            {link.title}
                          </h4>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-slate-500 hover:text-indigo-600 truncate flex items-center gap-1.5 mt-1 transition-colors"
                            title={link.url}
                          >
                            <ExternalLink size={12} className="shrink-0" />
                            <span className="truncate">{link.url}</span>
                          </a>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id, link.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
