const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserQuery() {
  try {
    console.log('Testing user query with site_assignments...\n');
    
    // Test 1: Check if site_assignments table has role column
    const { data: tableInfo, error: tableError } = await supabase
      .from('site_assignments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking site_assignments table:', tableError);
    } else {
      console.log('site_assignments table sample:', tableInfo);
      if (tableInfo && tableInfo.length > 0) {
        console.log('Available columns:', Object.keys(tableInfo[0]));
      }
    }
    
    console.log('\n---\n');
    
    // Test 2: Run the actual query used in getUsers
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        *,
        site_assignments:site_assignments(
          site_id,
          role,
          assigned_date,
          is_active,
          site:sites(name)
        )
      `)
      .limit(5);
    
    if (usersError) {
      console.error('Error fetching users with site_assignments:', usersError);
    } else {
      console.log('Successfully fetched users:', users?.length || 0, 'users');
      if (users && users.length > 0) {
        console.log('\nFirst user data:');
        console.log('- Name:', users[0].full_name);
        console.log('- Email:', users[0].email);
        console.log('- Role:', users[0].role);
        console.log('- Site Assignments:', users[0].site_assignments);
      }
    }
    
    console.log('\n---\n');
    
    // Test 3: Check if there are any site_assignments records
    const { data: assignmentCount, error: countError } = await supabase
      .from('site_assignments')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting site_assignments:', countError);
    } else {
      console.log('Total site_assignments records:', assignmentCount);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUserQuery();