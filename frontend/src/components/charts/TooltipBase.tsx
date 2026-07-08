interface TooltipBaseProps {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}

export function TooltipBase({ title, rows }: TooltipBaseProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-card-hover p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-slate-900 mb-2 pb-1.5 border-b border-slate-100">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <span className="text-slate-500 capitalize">{row.label}</span>
            <span className={`font-semibold ${row.color ?? "text-slate-800"}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
