const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyRLSPolicies() {
  try {
    console.log('🔍 Applying RLS policies for admin user management...');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync('./scripts/fix-admin-rls.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlFile
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}...`);
      
      try {
        // Use a raw SQL approach since rpc might not work
        const { error } = await supabase.rpc('sql', { query: statement + ';' });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 RLS policies application completed!');
    
    // Test the result
    console.log('\n🔍 Testing admin access...');
    await testAdminAccess();
    
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
  }
}

async function testAdminAccess() {
  try {
    // Create a normal client (not service role)
    const normalClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Try to sign in as admin
    const { data: authData, error: authError } = await normalClient.auth.signInWithPassword({
      email: 'admin@inopnc.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ Cannot authenticate admin:', authError.message);
      return;
    }
    
    console.log('✅ Admin authenticated successfully');
    
    // Test access to profiles
    const { data: profiles, error: profilesError } = await normalClient
      .from('profiles')
      .select('email, role, full_name')
      .order('email');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`🎉 SUCCESS! Admin can now access ${profiles.length} users:`);
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.email} (${profile.role}) - ${profile.full_name}`);
      });
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

applyRLSPolicies();