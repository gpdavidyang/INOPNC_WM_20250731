const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCurrentState() {
  console.log('🔍 Testing current database state...\n');
  
  // Test 1: Check site_assignments structure
  const { data: sampleAssignment, error: assignmentError } = await supabase
    .from('site_assignments')
    .select('*')
    .limit(1);
  
  if (assignmentError) {
    console.error('❌ Error reading site_assignments:', assignmentError.message);
  } else if (sampleAssignment && sampleAssignment.length > 0) {
    console.log('✅ site_assignments table accessible');
    console.log('   Columns:', Object.keys(sampleAssignment[0]));
  }
  
  // Test 2: Test relationship query
  console.log('\n🔍 Testing profiles ↔ site_assignments relationship...');
  const { data: profileWithAssignments, error: relationError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      site_assignments (
        site_id,
        role,
        is_active
      )
    `)
    .limit(1);
  
  if (relationError) {
    console.error('❌ Relationship not working:', relationError.message);
  } else {
    console.log('✅ Relationship query successful');
  }
  
  // Test 3: Check test users
  console.log('\n🔍 Checking test users...');
  const { data: testUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('email', [
      'davidswyang@gmail.com',
      'admin@inopnc.com',
      'manager@inopnc.com',
      'worker@inopnc.com',
      'customer@inopnc.com'
    ]);
  
  if (usersError) {
    console.error('❌ Error fetching test users:', usersError.message);
  } else {
    console.log(`✅ Found ${testUsers.length} test users:`);
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
  }
  
  // Test 4: Check site assignments for test users
  console.log('\n🔍 Checking site assignments for test users...');
  const userIds = testUsers?.map(u => u.id) || [];
  
  if (userIds.length > 0) {
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select(`
        user_id,
        site_id,
        role,
        is_active,
        profiles!inner(email),
        sites!inner(name)
      `)
      .in('user_id', userIds);
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError.message);
    } else {
      console.log(`✅ Found ${assignments?.length || 0} assignments`);
      assignments?.forEach(a => {
        console.log(`   - ${a.profiles?.email} → ${a.sites?.name} (${a.role})`);
      });
    }
  }
}

async function createMissingSiteAssignments() {
  console.log('\n🔧 Creating missing site assignments...\n');
  
  try {
    // Get first active site
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(1);
    
    if (!sites || sites.length === 0) {
      console.error('❌ No active sites found');
      return;
    }
    
    const siteId = sites[0].id;
    console.log(`Using site: ${sites[0].name} (${siteId})`);
    
    // Get test users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('email', [
        'davidswyang@gmail.com',
        'admin@inopnc.com',
        'manager@inopnc.com',
        'worker@inopnc.com',
        'customer@inopnc.com'
      ]);
    
    if (!users || users.length === 0) {
      console.error('❌ No test users found');
      return;
    }
    
    // Create assignments
    for (const user of users) {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('site_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('site_id', siteId)
        .single();
      
      if (!existing) {
        const { error } = await supabase
          .from('site_assignments')
          .insert({
            site_id: siteId,
            user_id: user.id,
            role: user.role,
            is_active: true,
            assigned_date: new Date().toISOString().split('T')[0]
          });
        
        if (error) {
          console.error(`❌ Error creating assignment for ${user.email}:`, error.message);
        } else {
          console.log(`✅ Created assignment for ${user.email}`);
        }
      } else {
        console.log(`⏭️  Assignment already exists for ${user.email}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in createMissingSiteAssignments:', error);
  }
}

async function updateApiQueries() {
  console.log('\n📝 Recommended API query changes:\n');
  
  console.log('Instead of using nested select with site_assignments:');
  console.log(`
  // ❌ This doesn't work due to PostgREST cache issues
  const { data } = await supabase
    .from('profiles')
    .select(\`
      *,
      site_assignments (
        site_id,
        role,
        sites (name)
      )
    \`);
  `);
  
  console.log('\nUse separate queries or functions:');
  console.log(`
  // ✅ Option 1: Separate queries
  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  const { data: assignments } = await supabase
    .from('site_assignments')
    .select(\`
      *,
      sites (name, address)
    \`)
    .eq('user_id', userId)
    .eq('is_active', true);
  
  // ✅ Option 2: Use the view
  const { data } = await supabase
    .from('user_site_assignments')
    .select('*')
    .eq('user_id', userId);
  
  // ✅ Option 3: Use RPC function
  const { data } = await supabase
    .rpc('get_user_sites', { p_user_id: userId });
  `);
}

async function main() {
  console.log('🚀 Phase 0: Database Relationship Fix\n');
  console.log('=====================================\n');
  
  // Step 1: Test current state
  await testCurrentState();
  
  // Step 2: Create missing assignments
  await createMissingSiteAssignments();
  
  // Step 3: Test again
  console.log('\n🔍 Re-testing after fixes...\n');
  await testCurrentState();
  
  // Step 4: Show recommendations
  await updateApiQueries();
  
  console.log('\n✅ Phase 0 migration check complete!');
  console.log('\n📌 Next steps:');
  console.log('1. Update API queries to use separate queries or views');
  console.log('2. Test the admin dashboard with the new queries');
  console.log('3. Proceed to Phase 1 implementation');
}

main().catch(console.error);