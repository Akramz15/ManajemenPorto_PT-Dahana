import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, X } from "lucide-react";

interface ToastMessage {
  id: string;
  text: string;
}

export function UploadToastListener() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("chart-upload-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chart_data",
        },
        (payload) => {
          const contextStr = (payload.new as any).context;
          const newToast: ToastMessage = {
            id: crypto.randomUUID(),
            text: `Data ${contextStr ? contextStr.toUpperCase() : "baru"} telah diperbarui`,
          };
          setToasts((prev) => [...prev, newToast]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
          }, 4000);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 bg-white border border-slate-200
                     rounded-xl shadow-card-hover px-4 py-3 text-sm
                     animate-in slide-in-from-bottom-2 duration-300"
        >
          <CheckCircle size={16} className="text-positive-500 shrink-0" />
          <span className="text-slate-700 font-medium">{toast.text}</span>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
