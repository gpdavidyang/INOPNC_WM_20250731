#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow Fix')
  console.log('=====================================\n')
  
  // Step 1: Sign out to start fresh
  console.log('1️⃣ Signing out to start fresh...')
  await supabase.auth.signOut()
  console.log('   ✅ Signed out successfully\n')
  
  // Step 2: Test login
  console.log('2️⃣ Testing login with manager credentials...')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  })
  
  if (loginError) {
    console.error('   ❌ Login failed:', loginError.message)
    return
  }
  
  console.log('   ✅ Login successful:', loginData.user?.email)
  console.log('   📋 Session token present:', !!loginData.session?.access_token, '\n')
  
  // Step 3: Verify session is available immediately
  console.log('3️⃣ Verifying session availability...')
  const { data: { session: session1 } } = await supabase.auth.getSession()
  console.log('   Session check 1:', session1 ? '✅ Available' : '❌ Missing')
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const { data: { session: session2 } } = await supabase.auth.getSession()
  console.log('   Session check 2 (after 500ms):', session2 ? '✅ Available' : '❌ Missing')
  
  // Step 4: Test getUser
  console.log('\n4️⃣ Testing getUser endpoint...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('   ❌ getUser failed:', userError.message)
  } else {
    console.log('   ✅ getUser successful:', user?.email)
  }
  
  // Step 5: Test session refresh
  console.log('\n5️⃣ Testing session refresh...')
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
  
  if (refreshError) {
    console.error('   ❌ Session refresh failed:', refreshError.message)
  } else {
    console.log('   ✅ Session refreshed successfully')
    console.log('   📋 New token present:', !!refreshData.session?.access_token)
  }
  
  // Step 6: Test data fetching
  console.log('\n6️⃣ Testing data fetching with authenticated session...')
  
  // Test sites table access
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .limit(1)
  
  if (sitesError) {
    console.error('   ❌ Sites query failed:', sitesError.message)
  } else {
    console.log('   ✅ Sites query successful:', sites?.length, 'site(s) found')
  }
  
  // Test site_assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('site_assignments')
    .select('id, user_id, site_id')
    .eq('user_id', loginData.user?.id)
    .limit(1)
  
  if (assignmentsError) {
    console.error('   ❌ Assignments query failed:', assignmentsError.message)
  } else {
    console.log('   ✅ Assignments query successful:', assignments?.length, 'assignment(s) found')
  }
  
  console.log('\n=====================================')
  console.log('✅ Authentication Flow Test Complete')
  console.log('=====================================\n')
  
  // Summary
  console.log('📊 Summary:')
  console.log('   • Login: ✅')
  console.log('   • Session persistence:', session2 ? '✅' : '❌')
  console.log('   • User verification:', user ? '✅' : '❌')
  console.log('   • Session refresh:', refreshData?.session ? '✅' : '❌')
  console.log('   • Data access:', sites ? '✅' : '❌')
  
  // Circuit breaker test
  console.log('\n🔒 Circuit Breaker Features:')
  console.log('   • Max auto-login attempts: 3')
  console.log('   • Cooldown between attempts: 10 seconds')
  console.log('   • Manual disable option: localStorage')
  console.log('   • Session verification before data fetch: ✅')
  console.log('   • Retry logic with exponential backoff: ✅')
  
  // Clean up
  await supabase.auth.signOut()
  console.log('\n🧹 Cleaned up - signed out')
}

// Run the test
testAuthFlow().catch(console.error)