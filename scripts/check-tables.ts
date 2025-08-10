#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTables() {
  try {
    console.log('🔍 테이블 구조를 확인합니다...')

    // Check organizations table
    console.log('\n📊 Organizations 테이블:')
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      
    if (orgError) {
      console.log('Error:', orgError.message)
    } else {
      console.log('Sample data:', JSON.stringify(orgData, null, 2))
    }

    // Check sites table
    console.log('\n🏗️ Sites 테이블:')
    const { data: sitesData, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .limit(1)
      
    if (sitesError) {
      console.log('Error:', sitesError.message)
    } else {
      console.log('Sample data:', JSON.stringify(sitesData, null, 2))
    }

    // Check profiles table
    console.log('\n👷 Profiles 테이블:')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      
    if (profilesError) {
      console.log('Error:', profilesError.message)
    } else {
      console.log('Sample data:', JSON.stringify(profilesData, null, 2))
    }

    // Check daily_reports table
    console.log('\n📝 Daily Reports 테이블:')
    const { data: reportsData, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .limit(1)
      
    if (reportsError) {
      console.log('Error:', reportsError.message)
    } else {
      console.log('Sample data:', JSON.stringify(reportsData, null, 2))
    }

    // Check attendance_records table
    console.log('\n📅 Attendance Records 테이블:')
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .limit(1)
      
    if (attendanceError) {
      console.log('Error:', attendanceError.message)
    } else {
      console.log('Sample data:', JSON.stringify(attendanceData, null, 2))
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

checkTables()