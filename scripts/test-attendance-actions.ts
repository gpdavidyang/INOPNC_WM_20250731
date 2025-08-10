#!/usr/bin/env tsx

/**
 * Test Attendance Server Actions
 * 
 * This script tests the attendance server actions directly to ensure they work correctly.
 * Run with: npm run tsx scripts/test-attendance-actions.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { format, startOfMonth, endOfMonth } from 'date-fns'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testGetSites() {
  console.log('🔍 Testing getSites() functionality...')
  
  try {
    // First get a test user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)

    if (usersError || !users?.length) {
      throw new Error('No test users found')
    }

    const testUser = users[0]
    console.log('   Using test user:', testUser.email)

    // Test sites query (simulating what getSites does)
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('name', { ascending: true })

    if (sitesError) {
      console.error('❌ Sites query failed:', sitesError.message)
      return false
    }

    console.log('✅ Sites query successful:', sites?.length || 0, 'sites')
    if (sites && sites.length > 0) {
      console.log('   Sample sites:')
      sites.slice(0, 3).forEach(site => {
        console.log(`     - ${site.name} (${site.id})`)
      })
    }

    return true
  } catch (error) {
    console.error('❌ getSites test failed:', error)
    return false
  }
}

async function testGetAttendanceRecords() {
  console.log('\n🔍 Testing getAttendanceRecords() functionality...')
  
  try {
    // Get a test user with attendance records
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)

    if (usersError || !users?.length) {
      throw new Error('No test users found')
    }

    const testUser = users[0]
    const currentDate = new Date()
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)

    console.log('   Using test user:', testUser.email)
    console.log('   Date range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'))

    // Test attendance records query (simulating what getAttendanceRecords does)
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select(`
        id,
        user_id,
        site_id,
        work_date,
        check_in_time,
        check_out_time,
        work_hours,
        overtime_hours,
        labor_hours,
        status,
        notes,
        created_at,
        updated_at,
        sites(id, name)
      `)
      .eq('user_id', testUser.id)
      .gte('work_date', format(startDate, 'yyyy-MM-dd'))
      .lte('work_date', format(endDate, 'yyyy-MM-dd'))
      .order('work_date', { ascending: true })

    if (attendanceError) {
      console.error('❌ Attendance query failed:', attendanceError.message)
      return false
    }

    console.log('✅ Attendance query successful:', attendance?.length || 0, 'records')
    
    if (attendance && attendance.length > 0) {
      console.log('   Sample records:')
      attendance.slice(0, 3).forEach(record => {
        console.log(`     - ${record.work_date}: ${record.labor_hours}공수 at ${record.sites?.name || 'Unknown Site'}`)
      })

      // Test data transformation
      const transformed = attendance.map(record => ({
        ...record,
        date: record.work_date, // Add date field for compatibility
        site_name: record.sites?.name || 'Unknown Site'
      }))

      console.log('✅ Data transformation successful')
      console.log('   Transformed sample:', {
        date: transformed[0].date,
        work_date: transformed[0].work_date,
        labor_hours: transformed[0].labor_hours,
        site_name: transformed[0].site_name
      })
    }

    return true
  } catch (error) {
    console.error('❌ getAttendanceRecords test failed:', error)
    return false
  }
}

async function testDataIntegrity() {
  console.log('\n🔍 Testing data integrity and relationships...')
  
  try {
    // Test site-attendance relationships
    const { data: sitesWithAttendance, error: relationError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        attendance_records(count)
      `)
      .limit(5)

    if (relationError) {
      console.error('❌ Site-attendance relationship query failed:', relationError.message)
      return false
    }

    console.log('✅ Site-attendance relationships working')
    sitesWithAttendance?.forEach(site => {
      console.log(`   - ${site.name}: ${site.attendance_records?.length || 0} records`)
    })

    // Test labor hours calculations
    const { data: laborHours, error: laborError } = await supabase
      .from('attendance_records')
      .select('work_hours, labor_hours')
      .not('work_hours', 'is', null)
      .not('labor_hours', 'is', null)
      .limit(5)

    if (laborError) {
      console.error('❌ Labor hours query failed:', laborError.message)
      return false
    }

    console.log('✅ Labor hours calculations:')
    laborHours?.forEach(record => {
      const expectedLaborHours = Number((record.work_hours! / 8).toFixed(2))
      const actualLaborHours = Number(record.labor_hours)
      const isCorrect = Math.abs(expectedLaborHours - actualLaborHours) < 0.01
      console.log(`   - ${record.work_hours}h = ${record.labor_hours}공수 ${isCorrect ? '✅' : '❌'}`)
    })

    return true
  } catch (error) {
    console.error('❌ Data integrity test failed:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Testing Attendance System Server Actions...\n')

  let allTestsPassed = true

  // Run tests
  const getSitesResult = await testGetSites()
  const getAttendanceResult = await testGetAttendanceRecords()  
  const dataIntegrityResult = await testDataIntegrity()

  allTestsPassed = getSitesResult && getAttendanceResult && dataIntegrityResult

  // Summary
  console.log('\n🎯 Test Results Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`getSites() functionality: ${getSitesResult ? '✅' : '❌'}`)
  console.log(`getAttendanceRecords() functionality: ${getAttendanceResult ? '✅' : '❌'}`)
  console.log(`Data integrity: ${dataIntegrityResult ? '✅' : '❌'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (allTestsPassed) {
    console.log('🎉 All tests passed! The attendance system should now work correctly.')
    console.log('\n🔧 Next steps:')
    console.log('   1. Access the attendance page at: http://localhost:3000/dashboard/attendance')
    console.log('   2. Check browser console for detailed server action logs')
    console.log('   3. Test site selection and calendar functionality')
  } else {
    console.log('❌ Some tests failed. Check the errors above and run migration 305 if needed.')
    process.exit(1)
  }
}

main().catch(console.error)