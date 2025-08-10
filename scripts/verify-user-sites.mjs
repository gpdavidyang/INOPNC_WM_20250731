import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: join(__dirname, '..', '.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUserSites() {
  try {
    console.log('Verifying user site assignments...\n');

    // 1. Check today's assignments
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAssignments, error: todayError } = await supabase
      .from('user_sites')
      .select(`
        id,
        user_id,
        site_id,
        assigned_date,
        profiles!user_sites_user_id_fkey(full_name, email),
        sites!user_sites_site_id_fkey(name, address)
      `)
      .eq('assigned_date', today);

    if (todayError) {
      console.error('Error fetching today\'s assignments:', todayError);
    } else {
      console.log(`Today's assignments (${today}):`);
      console.log('================================');
      if (todayAssignments && todayAssignments.length > 0) {
        todayAssignments.forEach(a => {
          console.log(`✓ ${a.profiles?.full_name} (${a.profiles?.email})`);
          console.log(`  → ${a.sites?.name}`);
          console.log(`  📍 ${a.sites?.address}\n`);
        });
        console.log(`Total: ${todayAssignments.length} assignments for today\n`);
      } else {
        console.log('No assignments found for today.\n');
      }
    }

    // 2. Test the database function for a specific user
    const testEmail = 'worker@inopnc.com';
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', testEmail)
      .single();

    if (userData) {
      console.log(`\nTesting function for ${userData.full_name} (${testEmail}):`);
      console.log('================================');
      
      const { data: currentSite, error: funcError } = await supabase
        .rpc('get_current_user_site_from_assignments', { user_uuid: userData.id });

      if (funcError) {
        console.error('Function error:', funcError);
      } else if (currentSite && currentSite.length > 0) {
        const site = currentSite[0];
        console.log(`✓ Currently assigned to: ${site.site_name}`);
        console.log(`  Address: ${site.site_address}`);
        console.log(`  Work: ${site.work_process} - ${site.work_section}`);
        console.log(`  Manager: ${site.manager_name} (${site.construction_manager_phone})`);
      } else {
        console.log('No current site assignment found.');
      }
    }

    // 3. Summary statistics
    const { data: stats } = await supabase
      .from('user_sites')
      .select('id', { count: 'exact' });

    const { data: uniqueUsers } = await supabase
      .from('user_sites')
      .select('user_id')
      .eq('assigned_date', today);

    const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id) || []).size;

    console.log('\n\nSummary Statistics:');
    console.log('================================');
    console.log(`Total assignments in database: ${stats?.length || 0}`);
    console.log(`Users with assignments today: ${uniqueUserCount}`);
    console.log(`Assignments for today: ${todayAssignments?.length || 0}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyUserSites().then(() => {
  console.log('\n✅ Verification complete!');
  process.exit(0);
});