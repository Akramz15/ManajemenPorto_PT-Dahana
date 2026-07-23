import { useDialogStore } from "@/store/dialogStore";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useState, useEffect } from "react";

export function DialogProvider() {
  const { confirmState, alertState, promptState, resolveConfirm, resolvePrompt, closeAlert } =
    useDialogStore();
  const [promptInput, setPromptInput] = useState("");

  useEffect(() => {
    if (promptState?.defaultValue) {
      setPromptInput(promptState.defaultValue);
    } else {
      setPromptInput("");
    }
  }, [promptState]);

  return (
    <>
      {/* Confirm Dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => resolveConfirm(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex gap-4">
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmState.severity === "danger"
                    ? "bg-red-100 text-red-600"
                    : confirmState.severity === "success"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {confirmState.severity === "danger" ? (
                  <AlertTriangle size={24} />
                ) : confirmState.severity === "success" ? (
                  <CheckCircle size={24} />
                ) : (
                  <Info size={24} />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {confirmState.title ||
                    (confirmState.severity === "danger"
                      ? "Konfirmasi"
                      : "Informasi")}
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  {confirmState.message}
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => resolveConfirm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => resolveConfirm(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${
                      confirmState.severity === "danger"
                        ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                        : "bg-primary-600 hover:bg-primary-700 shadow-primary-500/20"
                    }`}
                  >
                    {confirmState.severity === "danger"
                      ? "Ya, Hapus"
                      : "Ya, Lanjutkan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Dialog */}
      {promptState && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => resolvePrompt(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {promptState.title || "Input Dibutuhkan"}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {promptState.message}
            </p>
            
            <input
              autoFocus
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  resolvePrompt(promptInput);
                }
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 focus:bg-white focus:border-primary-500 rounded-xl p-3 outline-none font-medium mb-6"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => resolvePrompt(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {promptState.cancelText || "Batal"}
              </button>
              <button
                onClick={() => resolvePrompt(promptInput)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20 transition-colors"
              >
                {promptState.confirmText || "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert/Toast */}
      {alertState && (
        <div className="fixed bottom-6 right-6 z-9999 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-4 min-w-75 max-w-md flex items-start gap-3 relative">
            <button
              onClick={closeAlert}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>

            <div
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                alertState.severity === "danger"
                  ? "bg-red-100 text-red-600"
                  : alertState.severity === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
              }`}
            >
              {alertState.severity === "danger" ? (
                <AlertTriangle size={18} />
              ) : alertState.severity === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>

            <div className="flex-1 pr-6">
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {alertState.title ||
                  (alertState.severity === "danger"
                    ? "Terjadi Kesalahan"
                    : alertState.severity === "success"
                      ? "Berhasil"
                      : "Informasi")}
              </h4>
              <p className="text-sm text-slate-600 leading-snug">
                {alertState.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
