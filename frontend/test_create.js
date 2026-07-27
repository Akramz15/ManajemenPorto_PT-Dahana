const { createClient } = require("@supabase/supabase-js");

const supabase = createClient("https://wndvnlizcrcvijrfjpgv.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHZubGl6Y3JjdmlqcmZqcGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNzM2ODksImV4cCI6MjA5ODk0OTY4OX0.LzVPNboPGeYeZDnBolI19lxRIEo27QkrGtqy7W3f0Do");

async function main() {
  const projects = [
    {
      id: "50000000-0000-4000-a000-000000000001",
      nama_proyek: "Streamlining",
      divisi: "lainnya",
      kategori: "lainnya",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      created_by: "system"
    },
    {
      id: "50000000-0000-4000-a000-000000000002",
      nama_proyek: "Akuisisi",
      divisi: "lainnya",
      kategori: "lainnya",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      created_by: "system"
    }
  ];
  
  const { data, error } = await supabase.from("projects").upsert(projects).select();
  console.log("Upsert result data:", data);
  if (error) {
    console.error("Upsert error:", error);
  }
}
main();
