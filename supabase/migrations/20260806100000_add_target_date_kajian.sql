-- Add target_date to kajian_tasks for checklist grouping
ALTER TABLE public.kajian_tasks ADD COLUMN target_date DATE;
