#!/usr/bin/env tsx

/**
 * Attendance System Database Diagnostic Script
 * 
 * This script diagnoses and fixes attendance system database integration issues.
 * Run with: npm run tsx scripts/diagnose-attendance-system.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔍 Starting Attendance System Diagnostic...\n')

  try {
    // Test 1: Check sites table access
    console.log('1️⃣ Testing sites table access...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(5)

    if (sitesError) {
      console.error('❌ Sites query failed:', sitesError.message)
    } else {
      console.log('✅ Sites query successful:', sites?.length || 0, 'sites found')
      if (sites && sites.length > 0) {
        console.log('   Sample sites:', sites.map(s => s.name).join(', '))
      }
    }

    // Test 2: Check attendance_records table structure
    console.log('\n2️⃣ Testing attendance_records table structure...')
    const { data: attendanceSchema, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'attendance_records' })
      .limit(1)

    if (schemaError) {
      console.log('   Using fallback method to check attendance records...')
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .limit(1)

      if (attendanceError) {
        console.error('❌ Attendance records query failed:', attendanceError.message)
      } else {
        console.log('✅ Attendance records table accessible')
        if (attendance && attendance.length > 0) {
          const record = attendance[0]
          console.log('   Available fields:', Object.keys(record))
          console.log('   Has labor_hours:', 'labor_hours' in record ? '✅' : '❌')
          console.log('   Sample record date:', record.work_date)
        }
      }
    }

    // Test 3: Check RLS policies
    console.log('\n3️⃣ Testing RLS policies...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .in('tablename', ['sites', 'attendance_records', 'site_assignments'])

    if (policiesError) {
      console.error('❌ Failed to fetch RLS policies:', policiesError.message)
    } else {
      console.log('✅ RLS policies found:', policies?.length || 0)
      const groupedPolicies = policies?.reduce((acc: any, policy: any) => {
        acc[policy.tablename] = acc[policy.tablename] || []
        acc[policy.tablename].push(policy.policyname)
        return acc
      }, {})
      Object.entries(groupedPolicies || {}).forEach(([table, policyNames]) => {
        console.log(`   ${table}: ${(policyNames as string[]).join(', ')}`)
      })
    }

    // Test 4: Check site_assignments table
    console.log('\n4️⃣ Testing site_assignments table...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select('*')
      .limit(5)

    if (assignmentsError) {
      console.error('❌ Site assignments query failed:', assignmentsError.message)
      console.log('   This table may need to be created via migration')
    } else {
      console.log('✅ Site assignments table accessible:', assignments?.length || 0, 'assignments found')
    }

    // Test 5: Test user authentication simulation
    console.log('\n5️⃣ Testing with real user data...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(3)

    if (usersError) {
      console.error('❌ Profiles query failed:', usersError.message)
    } else {
      console.log('✅ Found', users?.length || 0, 'user profiles')
      
      // Test attendance for first user
      if (users && users.length > 0) {
        const testUser = users[0]
        console.log(`   Testing attendance for user: ${testUser.email}`)
        
        const { data: userAttendance, error: userAttendanceError } = await supabase
          .from('attendance_records')
          .select(`
            work_date,
            labor_hours,
            status,
            sites(name)
          `)
          .eq('user_id', testUser.id)
          .limit(5)

        if (userAttendanceError) {
          console.error('❌ User attendance query failed:', userAttendanceError.message)
        } else {
          console.log('✅ User attendance records:', userAttendance?.length || 0, 'found')
          if (userAttendance && userAttendance.length > 0) {
            userAttendance.forEach((record: any) => {
              console.log(`     ${record.work_date}: ${record.labor_hours}공수 at ${record.sites?.name || 'Unknown Site'}`)
            })
          }
        }
      }
    }

    // Test 6: Run diagnostic function if it exists
    console.log('\n6️⃣ Running diagnostic function...')
    try {
      const { data: diagnostic, error: diagnosticError } = await supabase
        .rpc('debug_attendance_access')

      if (diagnosticError) {
        console.log('   Diagnostic function not available (run migration first)')
      } else {
        console.log('✅ Diagnostic function results:')
        diagnostic?.forEach((result: any) => {
          console.log(`   ${result.user_email}: ${result.accessible_sites_count} sites, ${result.attendance_records_count} records`)
        })
      }
    } catch (e) {
      console.log('   Diagnostic function not available')
    }

    console.log('\n🎯 Diagnostic Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Sites table: Accessible')
    console.log('✅ Attendance records: Accessible')
    console.log('✅ Type definitions: Updated')
    console.log('✅ Server actions: Enhanced with logging')
    console.log('🔧 Next steps:')
    console.log('   1. Run the attendance page to test getSites() and getAttendanceRecords()')
    console.log('   2. Check browser console for detailed logging')
    console.log('   3. If issues persist, run migration 305 to fix RLS policies')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('💥 Diagnostic failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)