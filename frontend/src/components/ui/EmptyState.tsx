import { UploadCloud } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Belum ada data",
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="text-slate-300">{icon ?? <UploadCloud size={36} />}</div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
