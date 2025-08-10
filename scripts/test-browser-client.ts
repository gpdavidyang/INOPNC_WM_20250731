import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use the same client creation method as the UI
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

async function testBrowserClient() {
  console.log('🌐 Testing Browser Client (same as UI)...\n')
  
  try {
    // 1. Check if there's already a session
    console.log('=== Step 1: Check existing session ===')
    const { data: existingSession } = await supabase.auth.getSession()
    
    if (existingSession.session) {
      console.log('⚠️ Found existing session for:', existingSession.session.user.email)
      await supabase.auth.signOut()
      console.log('✅ Cleared existing session')
    }
    
    // 2. Sign in fresh
    console.log('\n=== Step 2: Fresh sign in ===')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    console.log('✅ Authenticated as:', authData.user?.email)
    
    // 3. Get profile using browser client
    console.log('\n=== Step 3: Get profile with browser client ===')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Profile:', {
        id: profile.id,
        email: profile.email,
        role: profile.role
      })
    }
    
    // 4. Test work logs query with browser client
    console.log('\n=== Step 4: Work logs query with browser client ===')
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
    
    if (profile?.role === 'worker') {
      console.log('🔍 Applying worker filter')
      query.eq('created_by', profile.id)
    } else {
      console.log('🔍 No filter - role is:', profile?.role)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Query error:', error)
    } else {
      console.log(`✅ Found ${data?.length || 0} work logs`)
      if (data && data.length > 0) {
        console.log('📋 Sample:', {
          work_date: data[0].work_date,
          member_name: data[0].member_name,
          site_name: data[0].sites?.name
        })
      }
    }
    
    // 5. Test data transformation (same as UI)
    console.log('\n=== Step 5: Test data transformation ===')
    if (data && data.length > 0) {
      const transformedLogs = data.map(report => ({
        id: report.id,
        work_date: report.work_date,
        site_name: report.sites?.name || 'Unknown Site',
        work_content: `${report.member_name || ''} - ${report.process_type || ''}: ${report.issues || ''}`,
        status: (report.status === 'approved' || report.status === 'submitted') ? 'submitted' : 'draft',
        created_at: report.created_at,
        updated_at: report.updated_at,
        created_by_name: 'Site Manager',
        site_id: report.site_id
      }))
      
      console.log('✅ Transformation successful')
      console.log('📋 Transformed sample:', {
        work_date: transformedLogs[0].work_date,
        site_name: transformedLogs[0].site_name,
        work_content: transformedLogs[0].work_content,
        status: transformedLogs[0].status
      })
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  } finally {
    await supabase.auth.signOut()
    console.log('\n✅ Signed out')
  }
}

testBrowserClient()