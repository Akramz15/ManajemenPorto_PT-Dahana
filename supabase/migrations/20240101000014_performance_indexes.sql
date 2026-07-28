-- Performance Optimization Indexes
-- These indexes prevent Full Table Scans on frequently queried columns

CREATE INDEX IF NOT EXISTS idx_projects_kategori ON public.projects(kategori);
CREATE INDEX IF NOT EXISTS idx_projects_divisi ON public.projects(divisi);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_activities_project_id ON public.project_progress_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_activities_year_month ON public.project_progress_activities(year, month);
CREATE INDEX IF NOT EXISTS idx_kajian_tasks_project_id ON public.kajian_tasks(project_id);
