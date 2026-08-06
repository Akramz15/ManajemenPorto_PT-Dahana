-- Create portfolio_links table
CREATE TABLE public.portfolio_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.portfolio_links ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow authenticated users to read portfolio links" 
  ON public.portfolio_links 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow insert access for authenticated users
CREATE POLICY "Allow authenticated users to insert portfolio links" 
  ON public.portfolio_links 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Allow update access for authenticated users
CREATE POLICY "Allow authenticated users to update portfolio links" 
  ON public.portfolio_links 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Allow delete access for authenticated users
CREATE POLICY "Allow authenticated users to delete portfolio links" 
  ON public.portfolio_links 
  FOR DELETE 
  TO authenticated 
  USING (true);
