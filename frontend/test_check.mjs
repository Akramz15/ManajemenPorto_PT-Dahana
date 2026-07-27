import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://wndvnlizcrcvijrfjpgv.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHZubGl6Y3JjdmlqcmZqcGd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM3MzY4OSwiZXhwIjoyMDk4OTQ5Njg5fQ.dCxCNf84BkIh6Q_FHDLAdo0pD99YTWUy4QSZgMa11U8");

async function main() {
  const { data, error } = await supabase.from("projects").select("*").in("id", ["50000000-0000-4000-a000-000000000001", "50000000-0000-4000-a000-000000000002"]);
  console.log("Data:", data);
}
main();
