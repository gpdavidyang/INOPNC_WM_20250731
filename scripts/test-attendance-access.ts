import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAttendanceAccess() {
  console.log('🔍 Testing Attendance Records Access\n')
  console.log('=' + '='.repeat(50))
  
  try {
    // Test login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }
    
    console.log('✅ Logged in as:', authData.user?.email)
    console.log('   User ID:', authData.user?.id)
    
    // Test attendance records query
    console.log('\n📅 Testing attendance_records query...')
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select(`
        id,
        work_date,
        user_id,
        site_id,
        labor_hours,
        status,
        sites(name)
      `)
      .eq('user_id', authData.user?.id)
      .order('work_date', { ascending: false })
      .limit(5)
    
    if (attendanceError) {
      console.error('❌ Error fetching attendance:', attendanceError)
    } else {
      console.log('✅ Attendance records found:', attendance?.length || 0)
      if (attendance && attendance.length > 0) {
        console.log('\n   Sample records:')
        attendance.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.work_date} - ${record.sites?.name || 'No site'} - ${record.labor_hours || 0}공수`)
        })
      }
    }
    
    // Test sites query
    console.log('\n🏗️ Testing sites query...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, status')
      .eq('status', 'active')
    
    if (sitesError) {
      console.error('❌ Error fetching sites:', sitesError)
    } else {
      console.log('✅ Sites found:', sites?.length || 0)
      if (sites && sites.length > 0) {
        console.log('   Sites:')
        sites.forEach(site => {
          console.log(`   - ${site.name} (${site.status})`)
        })
      }
    }
    
    // Test site_assignments query
    console.log('\n👥 Testing site_assignments query...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select('site_id, is_active')
      .eq('user_id', authData.user?.id)
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError)
    } else {
      console.log('✅ Site assignments found:', assignments?.length || 0)
    }
    
    // Test if we can query attendance without user_id filter (should only return accessible records)
    console.log('\n🔓 Testing broad attendance query (without user_id filter)...')
    const { data: broadAttendance, error: broadError } = await supabase
      .from('attendance_records')
      .select('id, work_date, user_id')
      .limit(10)
    
    if (broadError) {
      console.error('❌ Error with broad query:', broadError)
    } else {
      console.log('✅ Accessible records:', broadAttendance?.length || 0)
      if (broadAttendance && broadAttendance.length > 0) {
        const uniqueUsers = new Set(broadAttendance.map(r => r.user_id))
        console.log('   Unique users in results:', uniqueUsers.size)
      }
    }
    
    console.log('\n' + '=' + '='.repeat(50))
    console.log('✅ Test completed successfully')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testAttendanceAccess()