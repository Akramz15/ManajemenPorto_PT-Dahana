-- Migrate documents from file storage to taplink/external URL

ALTER TABLE public.documents 
  RENAME COLUMN storage_path TO document_url;

ALTER TABLE public.documents 
  DROP COLUMN IF EXISTS file_size;

ALTER TABLE public.documents 
  ADD COLUMN document_type text DEFAULT 'link';
