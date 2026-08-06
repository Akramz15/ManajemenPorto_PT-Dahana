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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white/80 backdrop-blur-xl relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                  <Link size={22} strokeWidth={2} />
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
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 hover:shadow-primary-600/40 hover:-translate-y-0.5"
                  >
                    <Plus size={18} strokeWidth={2.5} /> Tambah Tautan
                  </button>
                </div>
              )}

              {isAdding && (
                <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm mb-6 animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-slate-800 text-lg mb-5">{editingId ? 'Edit Tautan' : 'Tambah Tautan Baru'}</h4>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Judul Tautan</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Laporan Keuangan 2026"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">URL (Tautan Drive/Web)</label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
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
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 disabled:opacity-50"
                      >
                        {isSaving && <Spinner className="w-4 h-4" />}
                        Simpan Tautan
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="flex justify-center p-12">
                  <Spinner className="w-8 h-8 text-primary-500" />
                </div>
              ) : links.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Link2 size={28} className="text-slate-300" />
                  </div>
                  <h3 className="text-slate-800 font-black mb-2">Belum ada Tautan</h3>
                  <p className="text-sm text-slate-500 max-w-sm mb-6">
                    Anda belum menambahkan tautan Drive atau dokumen eksternal untuk portofolio ini.
                  </p>
                  {!isAdding && (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="text-primary-600 font-bold text-sm hover:text-primary-700 underline decoration-primary-200 underline-offset-4"
                    >
                      Tambah Tautan Pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {links.map((link) => (
                    <div key={link.id} className="bg-white p-4 sm:px-5 sm:py-4 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/5 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 pl-1">
                          <h4 className="font-bold text-slate-800 text-sm md:text-base truncate pr-2" title={link.title}>
                            {link.title}
                          </h4>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[13px] text-slate-500 hover:text-primary-600 truncate flex items-center gap-1.5 mt-0.5 transition-colors"
                            title={link.url}
                          >
                            <ExternalLink size={13} className="shrink-0" />
                            <span className="truncate">{link.url}</span>
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
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
