-- Add task_type to kajian_tasks for differentiating Update and Rencana Kedepan
ALTER TABLE public.kajian_tasks ADD COLUMN task_type text not null default 'update' check (task_type in ('update', 'rencana_kedepan'));

-- Create an index to make filtering by task_type faster
CREATE INDEX IF NOT EXISTS idx_kt_task_type ON public.kajian_tasks(task_type);
