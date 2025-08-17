const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  try {
    // Check profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role, site_id')
      .limit(10);
    
    console.log('Profiles found:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('Sample profiles:');
      profiles.slice(0, 5).forEach(p => {
        console.log(`  • ${p.email}: ${p.role}, site: ${p.site_id}`);
      });
    }
    
    // Check auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    console.log('\nAuth users found:', authUsers?.users?.length || 0);
    if (authUsers?.users && authUsers.users.length > 0) {
      console.log('Sample auth users:');
      authUsers.users.slice(0, 5).forEach(u => {
        console.log(`  • ${u.email}: ${u.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkUsers();