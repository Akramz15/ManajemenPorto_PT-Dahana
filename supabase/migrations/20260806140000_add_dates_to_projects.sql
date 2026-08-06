DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='start_date') THEN
        ALTER TABLE public.projects ADD COLUMN start_date date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='end_date') THEN
        ALTER TABLE public.projects ADD COLUMN end_date date;
    END IF;
END $$;
