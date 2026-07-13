import { Loader2, AlertCircle, UploadCloud } from "lucide-react";
import React from "react";

interface ChartShellProps {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  onUploadClick?: () => void;
  children: React.ReactNode;
  height?: number;
}

export function ChartShell({
  loading,
  error,
  hasData,
  onUploadClick,
  children,
  height = 360,
}: ChartShellProps) {
  if (loading) {
    return (
      <div
        className="card w-full flex items-center justify-center"
        style={{ minHeight: height }}
      >
        <Loader2 size={24} className="text-primary-400 animate-spin" />
      </div>
    );
  }

  if (error || !hasData) {
    return (
      <div
        className="card w-full flex flex-col items-center justify-center gap-3 text-slate-400"
        style={{ minHeight: height }}
      >
        {error ? (
          <>
            <AlertCircle size={28} className="text-negative-400" />
            <p className="text-sm text-center text-slate-500 max-w-xs">
              {error}
            </p>
          </>
        ) : (
          <>
            <UploadCloud size={32} className="opacity-40" />
            <p className="text-sm text-slate-500">
              Belum ada data. Upload file Excel untuk mulai.
            </p>
            {onUploadClick && (
              <button onClick={onUploadClick} className="btn-primary mt-2">
                Upload Excel
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
