-- Add target_time to user_todos for optional time tracking
ALTER TABLE public.user_todos ADD COLUMN target_time text;
