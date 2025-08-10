import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUIAuthentication() {
  console.log('🔐 Testing UI Authentication Flow...\n')
  
  try {
    // 1. Sign in as manager
    console.log('=== Step 1: Sign in as manager ===')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    console.log('✅ Authenticated as:', authData.user?.email)
    console.log('✅ User ID:', authData.user?.id)
    
    // 2. Check current session
    console.log('\n=== Step 2: Check session ===')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
    } else if (session.session) {
      console.log('✅ Active session found')
      console.log('✅ Session user:', session.session.user.email)
    } else {
      console.log('❌ No active session')
    }
    
    // 3. Get user object (like the UI would)
    console.log('\n=== Step 3: Get current user ===')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User error:', userError)
    } else if (user) {
      console.log('✅ Current user:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })
    } else {
      console.log('❌ No current user')
    }
    
    // 4. Get profile (like DashboardLayout would)
    console.log('\n=== Step 4: Get profile ===')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Profile found:', {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      })
    }
    
    // 5. Test the work logs query with this profile
    console.log('\n=== Step 5: Test work logs query ===')
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
        sites!inner(
          id,
          name
        )
      `)
      .order('work_date', { ascending: false })
      .limit(5)
    
    // Apply role-based filtering
    if (profile?.role === 'worker') {
      console.log('🔍 Applying worker filter for user:', profile.id)
      query.eq('created_by', profile.id)
    } else {
      console.log('🔍 No filter applied - user role is:', profile?.role)
    }
    
    const { data: workLogs, error: workLogsError } = await query
    
    if (workLogsError) {
      console.error('❌ Work logs error:', workLogsError)
    } else {
      console.log(`✅ Work logs query successful! Found ${workLogs?.length || 0} reports`)
      if (workLogs && workLogs.length > 0) {
        console.log('📋 First work log:', {
          id: workLogs[0].id,
          work_date: workLogs[0].work_date,
          member_name: workLogs[0].member_name,
          site_name: workLogs[0].sites?.name,
          status: workLogs[0].status
        })
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  } finally {
    // Clean up
    await supabase.auth.signOut()
    console.log('\n✅ Signed out')
  }
}

testUIAuthentication()