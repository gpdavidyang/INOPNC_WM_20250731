#!/usr/bin/env node

/**
 * Test script to verify session synchronization between client and server
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSessionSync() {
  console.log('🧪 Testing Session Synchronization...\n')
  
  try {
    // Step 1: Sign in
    console.log('1️⃣ Signing in as manager@inopnc.com...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message)
      return
    }
    
    console.log('✅ Sign in successful:', signInData.user?.email)
    console.log('   Session token:', signInData.session?.access_token ? '✅ Present' : '❌ Missing')
    
    // Step 2: Get session
    console.log('\n2️⃣ Getting current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Get session failed:', sessionError.message)
      return
    }
    
    console.log('✅ Session retrieved:', session ? 'Present' : 'Missing')
    console.log('   User:', session?.user?.email)
    
    // Step 3: Verify user
    console.log('\n3️⃣ Verifying user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User verification failed:', userError.message)
      return
    }
    
    console.log('✅ User verified:', user?.email)
    
    // Step 4: Test database access
    console.log('\n4️⃣ Testing database access...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(1)
    
    if (sitesError) {
      console.error('❌ Database access failed:', sitesError.message)
      return
    }
    
    console.log('✅ Database accessible, found sites:', sites?.length || 0)
    
    // Step 5: Test site assignments
    console.log('\n5️⃣ Testing site assignments...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select('*, sites(name)')
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    if (assignmentsError) {
      console.error('❌ Site assignments query failed:', assignmentsError.message)
      return
    }
    
    console.log('✅ Site assignments found:', assignments?.length || 0)
    if (assignments && assignments.length > 0) {
      console.log('   Active site:', assignments[0].sites?.name)
    }
    
    // Step 6: Refresh session
    console.log('\n6️⃣ Refreshing session...')
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.error('❌ Session refresh failed:', refreshError.message)
      return
    }
    
    console.log('✅ Session refreshed successfully')
    console.log('   New access token:', refreshedSession?.access_token ? '✅ Present' : '❌ Missing')
    
    // Step 7: Sign out
    console.log('\n7️⃣ Signing out...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message)
      return
    }
    
    console.log('✅ Sign out successful')
    
    console.log('\n✅ All session sync tests passed!')
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
  }
}

// Run the test
testSessionSync()