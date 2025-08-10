#!/usr/bin/env tsx
/**
 * Script to debug RLS access issues and check actual data
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugRLSAccess() {
  console.log('🔍 RLS 정책 및 데이터 접근 디버깅\n')
  console.log('=' + '='.repeat(60))
  
  try {
    // 서비스 롤로 실제 데이터 확인
    console.log('📊 서비스 롤로 데이터 조회:')
    
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .limit(5)
    
    if (attendanceError) {
      console.log('❌ 출근 기록 조회 실패:', attendanceError.message)
    } else {
      console.log(`\n✅ 출근 기록: ${attendance?.length || 0}건`)
      if (attendance && attendance.length > 0) {
        console.log('   컬럼:', Object.keys(attendance[0]).join(', '))
        attendance.forEach((record, index) => {
          console.log(`\n   기록 ${index + 1}:`)
          console.log(`   - ID: ${record.id}`)
          console.log(`   - 사용자 ID: ${record.user_id}`)
          console.log(`   - 작업 날짜: ${record.work_date}`)
          console.log(`   - 상태: ${record.status}`)
          console.log(`   - 공수: ${record.labor_hours}`)
          if (record.site_id) console.log(`   - 현장 ID: ${record.site_id}`)
        })
      }
    }
    
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .limit(3)
    
    if (reportsError) {
      console.log('❌ 작업일지 조회 실패:', reportsError.message)
    } else {
      console.log(`\n✅ 작업일지: ${reports?.length || 0}건`)
      if (reports && reports.length > 0) {
        console.log('   컬럼:', Object.keys(reports[0]).join(', '))
        reports.slice(0, 2).forEach((record, index) => {
          console.log(`\n   작업일지 ${index + 1}:`)
          console.log(`   - ID: ${record.id}`)
          console.log(`   - 작업자 ID: ${record.worker_id}`)
          console.log(`   - 작업 날짜: ${record.work_date}`)
          console.log(`   - 상태: ${record.status}`)
          if (record.site_id) console.log(`   - 현장 ID: ${record.site_id}`)
        })
      }
    }
    
    // 사용자별 데이터 실제 분포 확인
    console.log('\n📈 실제 데이터 분포:')
    
    if (attendance && attendance.length > 0) {
      const userCounts: Record<string, number> = {}
      attendance.forEach(record => {
        const userId = record.user_id
        userCounts[userId] = (userCounts[userId] || 0) + 1
      })
      
      console.log('\n   출근 기록 사용자별:')
      Object.entries(userCounts).forEach(([userId, count]) => {
        console.log(`   - ${userId}: ${count}건`)
      })
    }
    
    if (reports && reports.length > 0) {
      const workerCounts: Record<string, number> = {}
      reports.forEach(record => {
        const workerId = record.worker_id
        workerCounts[workerId] = (workerCounts[workerId] || 0) + 1
      })
      
      console.log('\n   작업일지 작업자별:')
      Object.entries(workerCounts).forEach(([workerId, count]) => {
        console.log(`   - ${workerId}: ${count}건`)
      })
    }
    
    // 사용자 목록과 매칭
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
    
    if (!profilesError && profiles) {
      console.log('\n👤 사용자 계정 매칭:')
      profiles.forEach(profile => {
        const attendanceCount = attendance?.filter(a => a.user_id === profile.id).length || 0
        const reportCount = reports?.filter(r => r.worker_id === profile.id).length || 0
        
        if (attendanceCount > 0 || reportCount > 0) {
          console.log(`   ✅ ${profile.email} (${profile.full_name})`)
          console.log(`      출근: ${attendanceCount}건, 작업일지: ${reportCount}건`)
        } else {
          console.log(`   ❌ ${profile.email} (${profile.full_name}) - 데이터 없음`)
        }
      })
    }
    
    // RLS 정책 정보
    console.log('\n🛡️  RLS 정책 관련:')
    console.log('   - attendance_records: 사용자는 본인 데이터만 조회 가능')
    console.log('   - daily_reports: 작업자는 본인 작업일지만 조회 가능')
    console.log('   - site_manager/admin: 해당 현장 데이터 조회 가능')
    
    console.log('\n💡 해결 방법:')
    console.log('   1. 데이터가 있는 계정으로 로그인')
    console.log('   2. 데이터가 없다면 테스트 데이터 생성 필요')
    console.log('   3. RLS 정책 확인 및 수정 필요')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

// 실행
debugRLSAccess().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})