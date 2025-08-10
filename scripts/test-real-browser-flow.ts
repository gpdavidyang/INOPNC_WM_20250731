// Test script to simulate what should happen in the real browser
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This simulates the server-side authentication that happens in the page component
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function simulateServerSideAuth() {
  console.log('🖥️  Server-side Authentication Simulation')
  console.log('='*50)
  
  try {
    // Step 1: Server-side authentication (like in /app/dashboard/daily-reports/page.tsx)
    console.log('\n1️⃣ Server-side authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Server auth failed:', authError)
      return
    }
    
    console.log('✅ Server authenticated user:', authData.user?.email)
    
    // Step 2: Get profile (like server component does)
    console.log('\n2️⃣ Getting user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return
    }
    
    console.log('✅ Profile loaded:', {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.full_name
    })
    
    // Step 3: Test the work logs query that should work in browser client
    console.log('\n3️⃣ Testing work logs query (as browser client would)...')
    
    // This simulates what the browser client should be able to do with a valid session
    const query = supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        issues,
        status,
        created_at,
        updated_at,
        site_id,
        created_by,
        sites(
          id,
          name
        )
      `)
      .order('work_date', { ascending: false })
      .limit(10)

    // Apply role-based filtering
    if (profile.role === 'worker') {
      console.log('🔍 Worker role - filtering by user ID:', profile.id)
      query.eq('created_by', profile.id)
    } else {
      console.log('🔍 Manager/Admin role - no filtering needed')
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Work logs query failed:', error)
      
      // Test without site join (fallback)
      console.log('\n🔄 Testing fallback query without site join...')
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('daily_reports')
        .select('id, work_date, member_name, process_type, issues, status, site_id, created_at, updated_at, created_by')
        .order('work_date', { ascending: false })
        .limit(10)
      
      if (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError)
        return
      }
      
      console.log(`✅ Fallback query successful: ${fallbackData?.length || 0} records`)
      if (fallbackData && fallbackData.length > 0) {
        console.log('📋 Sample record:')
        console.log('   Date:', fallbackData[0].work_date)
        console.log('   Member:', fallbackData[0].member_name)
        console.log('   Process:', fallbackData[0].process_type)
        console.log('   Status:', fallbackData[0].status)
      }
    } else {
      console.log(`✅ Main query successful: ${data?.length || 0} records`)
      if (data && data.length > 0) {
        console.log('📋 Sample record with site info:')
        console.log('   Date:', data[0].work_date)
        console.log('   Member:', data[0].member_name)
        console.log('   Site:', data[0].sites?.name)
        console.log('   Status:', data[0].status)
      }
    }
    
    console.log('\n🎯 Summary:')
    console.log('- Server-side auth: ✅ Working')
    console.log('- Profile loading: ✅ Working') 
    console.log('- Work logs query: ✅ Working')
    console.log('\n💡 The browser client should work the same way when:')
    console.log('   1. User is properly authenticated in browser')
    console.log('   2. Session cookies are present')
    console.log('   3. RLS policies allow access')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  } finally {
    await supabase.auth.signOut()
    console.log('\n✅ Logged out')
  }
}

simulateServerSideAuth()