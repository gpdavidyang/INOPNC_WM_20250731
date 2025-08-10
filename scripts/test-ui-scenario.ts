import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testUIScenario() {
  console.log('🎯 Testing UI Scenario - simulating browser client\n')
  
  try {
    // Sign in as manager (same as UI would do)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com', 
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message)
      return
    }
    
    console.log('✅ Authenticated as:', authData.user?.email)
    
    // Test the exact query that getDailyReports uses in the UI
    const filters = {
      start_date: '2025-07-01',
      end_date: '2025-08-31'
    }
    
    console.log('📋 Testing getDailyReports query with filters:', filters)
    
    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        site:sites(id, name)
      `)
      .order('work_date', { ascending: false })

    // Apply the same filters as the UI
    if (filters.start_date) {
      query = query.gte('work_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('work_date', filters.end_date)
    }

    const { data: reports, error: reportsError } = await query

    if (reportsError) {
      console.error('❌ Daily reports query failed:', reportsError)
      console.error('   Details:', reportsError.message)
      console.error('   Hint:', reportsError.hint)
      console.error('   Code:', reportsError.code)
    } else {
      console.log(`✅ Daily reports query successful: ${reports?.length || 0} records`)
      
      if (reports && reports.length > 0) {
        console.log('📋 Sample records:')
        reports.slice(0, 3).forEach((report, i) => {
          console.log(`   ${i + 1}. ${report.work_date} - ${report.member_name} (${report.site?.name})`)
        })
      } else {
        console.log('⚠️ No records returned - this is the UI issue!')
        
        // Let's try a simple query without filters
        console.log('\n🔍 Testing simple query without date filters...')
        const { data: simpleReports, error: simpleError } = await supabase
          .from('daily_reports')
          .select('*')
          .limit(5)
        
        if (simpleError) {
          console.error('❌ Simple query also failed:', simpleError.message)
        } else {
          console.log(`✅ Simple query worked: ${simpleReports?.length || 0} records`)
          if (simpleReports && simpleReports.length > 0) {
            console.log('   This means RLS is working but date filtering might be the issue')
            console.log('   Sample dates:', simpleReports.map(r => r.work_date))
          }
        }
      }
    }
    
    // Test sites query (used in the UI)
    console.log('\n🏗️ Testing sites query...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
      .order('name')
    
    if (sitesError) {
      console.error('❌ Sites query failed:', sitesError.message)
    } else {
      console.log(`✅ Sites query successful: ${sites?.length || 0} sites`)
      if (sites && sites.length > 0) {
        console.log('   Sites:', sites.map(s => s.name))
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  } finally {
    await supabase.auth.signOut()
    console.log('\n🔐 Signed out')
  }
}

testUIScenario()