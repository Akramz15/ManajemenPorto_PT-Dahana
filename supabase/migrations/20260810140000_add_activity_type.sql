ALTER TABLE public.project_progress_activities 
ADD COLUMN activity_type text not null default 'realisasi' check (activity_type in ('rencana', 'realisasi'));
