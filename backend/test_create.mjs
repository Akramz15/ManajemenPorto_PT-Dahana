import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://wndvnlizcrcvijrfjpgv.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHZubGl6Y3JjdmlqcmZqcGd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM3MzY4OSwiZXhwIjoyMDk4OTQ5Njg5fQ.dCxCNf84BkIh6Q_FHDLAdo0pD99YTWUy4QSZgMa11U8");

async function main() {
  const defaultProject = {
    id: "50000000-0000-4000-a000-000000000001",
    nama_proyek: "Streamlining",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    divisi: "komersial",
    kategori: "berjalan",
  };
  
  const { data, error } = await supabase.from("projects").upsert(defaultProject).select().single();
  console.log("Error:", error);
}
main();
