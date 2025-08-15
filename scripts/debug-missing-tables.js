const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugMissingTables() {
  console.log('🔍 Production Database Table Analysis');
  console.log('='.repeat(60));
  
  try {
    // Test authentication first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@inopnc.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('   User ID:', authData.user?.id);
    
    // List of tables that have been causing 401 errors based on error logs
    const problematicTables = [
      'analytics_events',
      'analytics_metrics', 
      'activity_logs',
      'data_exports',
      'push_subscriptions',
      'monitoring_metrics',
      'system_metrics'
    ];
    
    console.log('\n📊 Testing Table Access...');
    console.log('-'.repeat(60));
    
    const results = {
      existing: [],
      missing: [],
      accessDenied: []
    };
    
    for (const table of problematicTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            results.missing.push(table);
            console.log('❌ MISSING:', table);
          } else if (error.code === '42501' || error.message.includes('permission denied')) {
            results.accessDenied.push(table);
            console.log('🔒 ACCESS_DENIED:', table, '-', error.message);
          } else {
            console.log('⚠️  ERROR:', table, '-', error.message);
          }
        } else {
          results.existing.push(table);
          console.log('✅ EXISTS:', table, '- Records:', data?.length || 0);
        }
      } catch (error) {
        console.log('💥 EXCEPTION:', table, '-', error.message);
      }
    }
    
    console.log('\n📋 Summary Report');
    console.log('='.repeat(60));
    console.log('✅ Existing tables:', results.existing.length);
    if (results.existing.length > 0) {
      results.existing.forEach(table => console.log('   -', table));
    }
    
    console.log('\n❌ Missing tables:', results.missing.length);
    if (results.missing.length > 0) {
      results.missing.forEach(table => console.log('   -', table));
    }
    
    console.log('\n🔒 Access denied tables:', results.accessDenied.length);
    if (results.accessDenied.length > 0) {
      results.accessDenied.forEach(table => console.log('   -', table));
    }
    
    console.log('\n🎯 Recommendations');
    console.log('='.repeat(60));
    
    if (results.missing.length > 0) {
      console.log('1. MISSING TABLES - Create these tables or remove frontend references:');
      results.missing.forEach(table => {
        console.log('   - Either create table:', table);
        console.log('   - Or remove frontend code that queries:', table);
      });
    }
    
    if (results.accessDenied.length > 0) {
      console.log('2. ACCESS DENIED - Update RLS policies for:');
      results.accessDenied.forEach(table => {
        console.log('   - Add SELECT policy for authenticated users:', table);
      });
    }
    
    if (results.existing.length === problematicTables.length) {
      console.log('✅ All tables exist and are accessible!');
      console.log('   The 401 errors may be caused by other issues.');
    }
    
    console.log('\n🚀 Next Steps:');
    if (results.missing.length > 0 || results.accessDenied.length > 0) {
      console.log('1. Fix the identified table issues above');
      console.log('2. Redeploy the application');
      console.log('3. Test authentication flow again');
    } else {
      console.log('1. Tables appear to be properly configured');
      console.log('2. Investigate other causes of 401 errors');
      console.log('3. Check API endpoint implementations');
    }
    
  } catch (error) {
    console.error('💥 Debug script failed:', error.message);
  }
}

debugMissingTables().catch(console.error);