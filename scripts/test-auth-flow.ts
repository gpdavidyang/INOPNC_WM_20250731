// Test script to verify authentication flow
// Run with: npx tsx scripts/test-auth-flow.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthFlow() {
  console.log('🔍 Testing authentication flow...')
  
  // Test 1: Sign in with test credentials
  console.log('\n1️⃣ Testing sign in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'worker@inopnc.com',
    password: 'password123'
  })
  
  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message)
    return
  }
  
  console.log('✅ Sign in successful')
  console.log('   User ID:', signInData.user?.id)
  console.log('   Email:', signInData.user?.email)
  
  // Test 2: Get current user
  console.log('\n2️⃣ Testing getUser...')
  const { data: { user }, error: getUserError } = await supabase.auth.getUser()
  
  if (getUserError) {
    console.error('❌ getUser failed:', getUserError.message)
  } else {
    console.log('✅ getUser successful')
    console.log('   User ID:', user?.id)
  }
  
  // Test 3: Get session
  console.log('\n3️⃣ Testing getSession...')
  const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
  
  if (getSessionError) {
    console.error('❌ getSession failed:', getSessionError.message)
  } else {
    console.log('✅ getSession successful')
    console.log('   Session exists:', !!session)
    console.log('   Access token present:', !!session?.access_token)
  }
  
  // Test 4: Refresh session
  console.log('\n4️⃣ Testing session refresh...')
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
  
  if (refreshError) {
    console.error('❌ Session refresh failed:', refreshError.message)
  } else {
    console.log('✅ Session refresh successful')
    console.log('   New session exists:', !!refreshData.session)
  }
  
  // Test 5: Sign out
  console.log('\n5️⃣ Testing sign out...')
  const { error: signOutError } = await supabase.auth.signOut()
  
  if (signOutError) {
    console.error('❌ Sign out failed:', signOutError.message)
  } else {
    console.log('✅ Sign out successful')
  }
  
  // Test 6: Verify user is signed out
  console.log('\n6️⃣ Verifying sign out...')
  const { data: { user: afterSignOut } } = await supabase.auth.getUser()
  
  if (afterSignOut) {
    console.error('❌ User still authenticated after sign out')
  } else {
    console.log('✅ User successfully signed out')
  }
  
  console.log('\n✨ Authentication flow test complete!')
}

testAuthFlow().catch(console.error)