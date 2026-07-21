const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  const { data: profiles, error } = await supabase.from('user_profiles').select('*');
  console.log("Profiles:", profiles);
  const { data: users, error: err2 } = await supabase.auth.admin.listUsers();
  console.log("Users:", users?.users?.map(u => u.email));
}
checkProfiles();
