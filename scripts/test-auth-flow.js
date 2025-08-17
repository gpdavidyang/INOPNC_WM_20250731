import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

// Use anon key to simulate client-side behavior
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function testAuthFlow() {
  console.log('🔍 Testing authentication flow for manager@inopnc.com\n')
  console.log('='.repeat(60))

  try {
    // Step 1: Sign in
    console.log('\n📌 Step 1: Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message)
      return
    }

    console.log('✅ Sign in successful')
    console.log('  - User:', signInData.user.email)
    console.log('  - Session:', !!signInData.session)
    console.log('  - Access Token:', !!signInData.session?.access_token)

    // Step 2: Check session immediately
    console.log('\n📌 Step 2: Checking session immediately after sign in...')
    const { data: { session: immediateSession } } = await supabase.auth.getSession()
    console.log('  - Session exists:', !!immediateSession)
    console.log('  - User in session:', immediateSession?.user?.email)

    // Step 3: Check user
    console.log('\n📌 Step 3: Getting user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ Get user failed:', userError.message)
    } else {
      console.log('✅ User retrieved:', user?.email)
    }

    // Step 4: Query site_assignments with the session
    console.log('\n📌 Step 4: Querying site_assignments...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites (
          id,
          name,
          address,
          status
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (assignmentsError) {
      console.log('❌ Query failed:', assignmentsError.message)
      console.log('  - Error code:', assignmentsError.code)
      console.log('  - Error details:', assignmentsError.details)
    } else {
      console.log('✅ Query successful')
      console.log(`  - Found ${assignments?.length || 0} active assignments`)
      assignments?.forEach(assignment => {
        console.log(`  - Site: ${assignment.sites?.name} (${assignment.sites?.address})`)
      })
    }

    // Step 5: Test session refresh
    console.log('\n📌 Step 5: Testing session refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.log('❌ Refresh failed:', refreshError.message)
    } else {
      console.log('✅ Session refreshed')
      console.log('  - New access token:', !!refreshData.session?.access_token)
    }

    // Step 6: Check session after refresh
    console.log('\n📌 Step 6: Checking session after refresh...')
    const { data: { session: finalSession } } = await supabase.auth.getSession()
    console.log('  - Session exists:', !!finalSession)
    console.log('  - User in session:', finalSession?.user?.email)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY:')
    console.log('='.repeat(60))
    
    if (finalSession && assignments?.length > 0) {
      console.log('✅ Authentication flow working correctly')
      console.log('✅ User has access to assigned sites')
    } else if (finalSession && !assignments?.length) {
      console.log('✅ Authentication working')
      console.log('⚠️ But no active site assignments found')
    } else {
      console.log('❌ Session not persisting properly')
    }

    // Sign out at the end
    console.log('\n📌 Signing out...')
    await supabase.auth.signOut()
    console.log('✅ Signed out')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testAuthFlow()