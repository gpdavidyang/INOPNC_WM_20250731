// Production Environment Diagnostic Script
// Run this in production to verify database connectivity and table existence

const { createClient } = require('@supabase/supabase-js')

async function diagnoseProdEnvironment() {
  console.log('🔍 Production Environment Diagnostic\n')
  console.log('='.repeat(50))
  
  try {
    // 1. Environment Variables Check
    console.log('\n📋 Environment Variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('❌ CRITICAL: Missing Supabase environment variables')
      return
    }

    // 2. Supabase Connection Test
    console.log('\n🔌 Testing Supabase Connection...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (testError) {
      console.log('❌ Supabase connection failed:', testError.message)
      return
    }
    
    console.log('✅ Supabase connection successful')

    // 3. Table Existence Check
    console.log('\n📊 Checking table existence...')
    
    const tablesToCheck = [
      'analytics_metrics', 
      'push_subscriptions',
      'profiles',
      'sites',
      'organizations'
    ]

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', table)
          .maybeSingle()

        if (error) {
          console.log(`❌ Error checking ${table}:`, error.message)
        } else if (data) {
          console.log(`✅ Table ${table} exists`)
        } else {
          console.log(`❌ Table ${table} MISSING`)
        }
      } catch (e) {
        console.log(`❌ Exception checking ${table}:`, e.message)
      }
    }

    // 4. Analytics Metrics Table Structure Check
    console.log('\n🔍 Analytics Metrics Table Details...')
    try {
      const { data: tableInfo, error: structError } = await supabase
        .from('analytics_metrics')
        .select('*')
        .limit(1)

      if (structError) {
        console.log('❌ Analytics metrics table access failed:', structError.message)
        console.log('Error code:', structError.code)
        console.log('Error details:', structError.details)
      } else {
        console.log('✅ Analytics metrics table accessible')
        console.log('Sample data count:', tableInfo?.length || 0)
      }
    } catch (e) {
      console.log('❌ Analytics metrics exception:', e.message)
    }

    // 5. Push Subscriptions Table Check
    console.log('\n📱 Push Subscriptions Table Details...')
    try {
      const { data: pushData, error: pushError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .limit(1)

      if (pushError) {
        console.log('❌ Push subscriptions table access failed:', pushError.message)
        console.log('Error code:', pushError.code)
      } else {
        console.log('✅ Push subscriptions table accessible')
        console.log('Sample data count:', pushData?.length || 0)
      }
    } catch (e) {
      console.log('❌ Push subscriptions exception:', e.message)
    }

    // 6. Function Existence Check
    console.log('\n⚙️ Function Existence Check...')
    try {
      const { data: funcData, error: funcError } = await supabase.rpc('aggregate_daily_analytics', {
        p_organization_id: null,
        p_site_id: null,
        p_date: new Date().toISOString().split('T')[0]
      })

      if (funcError) {
        console.log('❌ Function call failed:', funcError.message)
        console.log('Error code:', funcError.code)
      } else {
        console.log('✅ aggregate_daily_analytics function exists and callable')
      }
    } catch (e) {
      console.log('❌ Function test exception:', e.message)
    }

  } catch (error) {
    console.log('💥 Global error:', error.message)
    console.log('Stack:', error.stack)
  }
}

// Test authentication simulation
async function testAuthFlow() {
  console.log('\n🔐 Testing Authentication Flow...')
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Try to sign in with demo account
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })

    if (authError) {
      console.log('❌ Authentication failed:', authError.message)
      return
    }

    console.log('✅ Authentication successful')
    console.log('User ID:', authData.user?.id)

    // Test analytics API call simulation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', authData.user?.id)
      .single()

    if (profileError) {
      console.log('❌ Profile lookup failed:', profileError.message)
    } else {
      console.log('✅ Profile found - Role:', profile.role)
      
      // Test analytics metrics access
      const { data: metrics, error: metricsError } = await supabase
        .from('analytics_metrics')
        .select('*')
        .limit(1)

      if (metricsError) {
        console.log('❌ Analytics metrics access failed:', metricsError.message)
      } else {
        console.log('✅ Analytics metrics accessible with auth')
      }
    }

    // Sign out
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')

  } catch (error) {
    console.log('💥 Auth test error:', error.message)
  }
}

// Run diagnostics
async function runAll() {
  await diagnoseProdEnvironment()
  await testAuthFlow()
  console.log('\n' + '='.repeat(50))
  console.log('🎯 Diagnostic complete!')
  console.log('Review the output above to identify the root cause.')
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { diagnoseProdEnvironment, testAuthFlow, runAll }
} else {
  // Browser environment
  window.diagnoseProdEnvironment = diagnoseProdEnvironment
  window.testAuthFlow = testAuthFlow
  window.runAll = runAll
}

// Auto-run if called directly
if (typeof window === 'undefined') {
  runAll()
}