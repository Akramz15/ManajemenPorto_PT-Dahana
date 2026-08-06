-- Drop existing check constraints dynamically
DO $$
DECLARE
    rec record;
BEGIN
    -- Drop constraints on 'divisi'
    FOR rec IN 
        SELECT con.conname 
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY(con.conkey)
        WHERE rel.relname = 'projects' AND attr.attname = 'divisi' AND con.contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.projects DROP CONSTRAINT ' || quote_ident(rec.conname);
    END LOOP;

    -- Drop constraints on 'kategori'
    FOR rec IN 
        SELECT con.conname 
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY(con.conkey)
        WHERE rel.relname = 'projects' AND attr.attname = 'kategori' AND con.contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.projects DROP CONSTRAINT ' || quote_ident(rec.conname);
    END LOOP;
END $$;

-- Add new constraints allowing 'lainnya'
ALTER TABLE public.projects 
  ADD CONSTRAINT projects_divisi_check CHECK (divisi IN ('komersial', 'pertahanan', 'lainnya'));

ALTER TABLE public.projects 
  ADD CONSTRAINT projects_kategori_check CHECK (kategori IN ('berjalan', 'kajian', 'lainnya'));

-- Seed "Streamlining" and "Akuisisi" if they don't exist
INSERT INTO public.projects (id, nama_proyek, divisi, kategori)
VALUES 
  ('50000000-0000-4000-a000-000000000001', 'Streamlining', 'lainnya', 'lainnya'),
  ('50000000-0000-4000-a000-000000000002', 'Akuisisi', 'lainnya', 'lainnya')
ON CONFLICT (id) DO UPDATE SET
  divisi = 'lainnya',
  kategori = 'lainnya';
