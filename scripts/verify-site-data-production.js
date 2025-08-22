const { createClient } = require('@supabase/supabase-js');

// Production Supabase credentials
const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyProductionData() {
  console.log('🔍 Verifying Production Database Data...\n');
  
  try {
    // 1. Check sites table
    console.log('1️⃣ Checking sites table:');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*');
    
    if (sitesError) {
      console.error('❌ Sites error:', sitesError);
    } else {
      console.log(`✅ Found ${sites.length} sites`);
      sites.forEach(site => {
        console.log(`   - ${site.name} (ID: ${site.id})`);
      });
    }
    
    // 2. Check site_assignments table
    console.log('\n2️⃣ Checking site_assignments table:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          role
        ),
        sites:site_id (
          name
        )
      `);
    
    if (assignmentsError) {
      console.error('❌ Site assignments error:', assignmentsError);
    } else {
      console.log(`✅ Found ${assignments.length} assignments`);
      
      // Group by role
      const byRole = {};
      assignments.forEach(a => {
        const role = a.profiles?.role || 'unknown';
        if (!byRole[role]) byRole[role] = [];
        byRole[role].push(a);
      });
      
      Object.keys(byRole).forEach(role => {
        console.log(`\n   Role: ${role} (${byRole[role].length} users)`);
        byRole[role].forEach(a => {
          console.log(`   - ${a.profiles?.email} → ${a.sites?.name} (Active: ${a.is_active})`);
        });
      });
    }
    
    // 3. Check specific test users
    console.log('\n3️⃣ Checking specific test users:');
    const testUsers = [
      'manager@inopnc.com',
      'production@inopnc.com',
      'worker@inopnc.com'
    ];
    
    for (const email of testUsers) {
      console.log(`\n   Checking ${email}:`);
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (profileError) {
        console.log(`   ❌ Profile not found: ${profileError.message}`);
        continue;
      }
      
      console.log(`   ✅ Profile found - Role: ${profile.role}, ID: ${profile.id}`);
      
      // Get their site assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('site_assignments')
        .select(`
          *,
          sites:site_id (
            name,
            address,
            contact_person,
            contact_phone
          )
        `)
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .single();
      
      if (assignmentError) {
        console.log(`   ❌ No active site assignment: ${assignmentError.message}`);
      } else {
        console.log(`   ✅ Assigned to: ${assignment.sites.name}`);
        console.log(`      Address: ${assignment.sites.address}`);
        console.log(`      Contact: ${assignment.sites.contact_person} (${assignment.sites.contact_phone})`);
      }
    }
    
    // 4. Test RLS policies
    console.log('\n4️⃣ Testing RLS policies for manager@inopnc.com:');
    
    // Get manager user
    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'manager@inopnc.com')
      .single();
    
    if (managerProfile) {
      // Test direct query as service role (bypasses RLS)
      const { data: directQuery, error: directError } = await supabase
        .from('site_assignments')
        .select('*, sites(*)')
        .eq('user_id', managerProfile.id)
        .eq('is_active', true);
      
      if (directError) {
        console.log('   ❌ Direct query failed:', directError.message);
      } else {
        console.log(`   ✅ Direct query (service role): Found ${directQuery?.length || 0} assignments`);
        directQuery?.forEach(a => {
          console.log(`      - ${a.sites?.name || 'Unknown site'}`);
        });
      }
    }
    
    // 5. Check if tables exist
    console.log('\n5️⃣ Verifying table structure:');
    
    // Check site_assignments columns
    const { data: tableInfo, error: tableError } = await supabase
      .from('site_assignments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('   ❌ site_assignments table error:', tableError.message);
    } else {
      const columns = tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [];
      console.log('   ✅ site_assignments columns:', columns.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyProductionData();
