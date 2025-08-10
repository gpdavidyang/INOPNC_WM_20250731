import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testDataConnection() {
  console.log('🔍 Testing Supabase data connection...\n')
  
  try {
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Auth Error:', authError.message)
      return
    }
    
    console.log('✅ Authentication successful:', authData.user?.email)
    
    // Test work logs (daily_reports) query
    const { data: dailyReports, error: reportsError } = await supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        issues,
        status,
        site_id,
        sites!inner(name)
      `)
      .order('work_date', { ascending: false })
      .limit(10)
    
    if (reportsError) {
      console.error('❌ Daily Reports Error:', reportsError.message)
    } else {
      console.log(`✅ Daily Reports Query Success: ${dailyReports?.length || 0} records found`)
      if (dailyReports && dailyReports.length > 0) {
        console.log('📋 Sample record:', {
          id: dailyReports[0].id,
          work_date: dailyReports[0].work_date,
          member_name: dailyReports[0].member_name,
          site_name: dailyReports[0].sites?.name
        })
      }
    }
    
    // Test attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, work_date, work_hours, labor_hours, status, sites(name)')
      .eq('user_id', authData.user?.id)
      .order('work_date', { ascending: false })
      .limit(5)
    
    if (attendanceError) {
      console.error('❌ Attendance Error:', attendanceError.message)
    } else {
      console.log(`✅ Attendance Query Success: ${attendance?.length || 0} records found`)
      if (attendance && attendance.length > 0) {
        console.log('📅 Sample attendance:', {
          work_date: attendance[0].work_date,
          labor_hours: attendance[0].labor_hours,
          site_name: attendance[0].sites?.name
        })
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  } finally {
    await supabase.auth.signOut()
    console.log('\n🔐 Signed out')
  }
}

testDataConnection()