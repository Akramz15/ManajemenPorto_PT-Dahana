interface DashboardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}

const colClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 lg:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
};

export function DashboardGrid({ children, cols = 2, className = "" }: DashboardGridProps) {
  return (
    <div className={`grid gap-5 ${colClasses[cols]} ${className}`}>
      {children}
    </div>
  );
}
