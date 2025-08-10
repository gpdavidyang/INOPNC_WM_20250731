import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create two clients - one with anon key (like the UI) and one with service key
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function debugWorkLogsIssue() {
  console.log('🔍 Debugging Work Logs Issue...\n')
  
  try {
    // 1. Check what data exists with service key (bypasses RLS)
    console.log('=== Step 1: Check all daily_reports with service key (no RLS) ===')
    const { data: allReports, error: allError } = await supabaseService
      .from('daily_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (allError) {
      console.error('Error fetching all reports:', allError)
    } else {
      console.log(`Found ${allReports?.length || 0} reports in database`)
      if (allReports && allReports.length > 0) {
        console.log('Sample report:', {
          id: allReports[0].id,
          work_date: allReports[0].work_date,
          site_id: allReports[0].site_id,
          created_by: allReports[0].created_by,
          status: allReports[0].status,
          member_name: allReports[0].member_name,
          process_type: allReports[0].process_type,
          issues: allReports[0].issues
        })
      }
    }
    
    // 2. Try to authenticate as manager and check what they can see
    console.log('\n=== Step 2: Authenticate as manager@inopnc.com ===')
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('Auth error:', authError)
      return
    }
    
    console.log('✅ Authenticated as:', authData.user?.email)
    console.log('User ID:', authData.user?.id)
    
    // 3. Check profile data
    console.log('\n=== Step 3: Check manager profile ===')
    const { data: profile, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single()
    
    if (profileError) {
      console.error('Profile error:', profileError)
    } else {
      console.log('Profile:', {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      })
    }
    
    // 4. Try the exact same query as work-logs-tab.tsx
    console.log('\n=== Step 4: Try the exact query from work-logs-tab.tsx ===')
    const query = supabaseAnon
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
      .limit(50)
    
    // Apply role-based filtering (manager should see all)
    if (profile?.role === 'worker') {
      query.eq('created_by', profile.id)
    }
    
    const { data: managerReports, error: managerError } = await query
    
    if (managerError) {
      console.error('❌ Query error:', managerError)
    } else {
      console.log(`✅ Query successful! Found ${managerReports?.length || 0} reports`)
      if (managerReports && managerReports.length > 0) {
        console.log('First report:', managerReports[0])
      }
    }
    
    // 5. Check if there are RLS policies blocking access
    console.log('\n=== Step 5: Check RLS policies ===')
    
    // Try simple query without joins
    const { data: simpleQuery, error: simpleError } = await supabaseAnon
      .from('daily_reports')
      .select('id, work_date, status')
      .limit(5)
    
    if (simpleError) {
      console.error('Simple query error:', simpleError)
    } else {
      console.log(`Simple query (no joins) found ${simpleQuery?.length || 0} reports`)
    }
    
    // 6. Check sites access
    console.log('\n=== Step 6: Check sites access ===')
    const { data: sites, error: sitesError } = await supabaseAnon
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
    
    if (sitesError) {
      console.error('Sites error:', sitesError)
    } else {
      console.log(`Found ${sites?.length || 0} sites`)
      if (sites && sites.length > 0) {
        console.log('First site:', sites[0])
      }
    }
    
    // 7. Try query with left join instead of inner join
    console.log('\n=== Step 7: Try with left join instead of inner join ===')
    const { data: leftJoinReports, error: leftJoinError } = await supabaseAnon
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        issues,
        status,
        site_id,
        sites(
          id,
          name
        )
      `)
      .limit(5)
    
    if (leftJoinError) {
      console.error('Left join error:', leftJoinError)
    } else {
      console.log(`Left join query found ${leftJoinReports?.length || 0} reports`)
      if (leftJoinReports && leftJoinReports.length > 0) {
        console.log('First report with left join:', leftJoinReports[0])
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  } finally {
    // Sign out
    await supabaseAnon.auth.signOut()
    console.log('\n✅ Signed out')
  }
}

debugWorkLogsIssue()