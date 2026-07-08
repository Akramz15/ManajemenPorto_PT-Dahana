import type { TaskStatus } from "@/types";

const STATUS_MAP: Record<TaskStatus, { label: string; className: string }> = {
  not_started: { label: "Belum Mulai", className: "badge-neutral" },
  in_progress: { label: "Berjalan", className: "badge-primary" },
  done: { label: "Selesai", className: "badge-positive" },
  blocked: { label: "Terhambat", className: "badge-negative" },
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status];
  return <span className={config.className}>{config.label}</span>;
}
