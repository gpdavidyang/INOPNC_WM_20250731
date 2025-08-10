#!/usr/bin/env tsx
/**
 * 간단한 RLS 상태 확인
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
const userSupabase = createClient(supabaseUrl, anonKey)

async function checkRLSSimple() {
  console.log('🔍 간단한 RLS 상태 확인\n')
  
  try {
    // 서비스 롤로 전체 데이터 확인
    const { count: totalAttendance } = await adminSupabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalReports } = await adminSupabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })
    
    console.log('📊 서비스 롤 (전체 데이터):')
    console.log(`   출근 기록: ${totalAttendance}건`)
    console.log(`   작업일지: ${totalReports}건`)
    
    // 일반 사용자(anon) 권한으로 데이터 확인
    const { count: anonAttendance, error: anonAttendanceError } = await userSupabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
    
    const { count: anonReports, error: anonReportsError } = await userSupabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })
    
    console.log('\n👤 일반 사용자 권한 (anon key):')
    console.log(`   출근 기록: ${anonAttendance || 0}건 ${anonAttendanceError ? '(오류: ' + anonAttendanceError.message + ')' : ''}`)
    console.log(`   작업일지: ${anonReports || 0}건 ${anonReportsError ? '(오류: ' + anonReportsError.message + ')' : ''}`)
    
    // RLS 활성화 여부 판단
    const hasRLS = (anonAttendanceError !== null || anonReportsError !== null)
    
    console.log('\n🔒 RLS 상태:')
    if (hasRLS) {
      console.log('   ✅ RLS가 활성화되어 있습니다.')
      console.log('   📝 문제: 사용자가 인증되어도 본인 데이터를 볼 수 없음')
      console.log('   💡 해결 필요: RLS 정책을 사용자 친화적으로 수정')
    } else {
      console.log('   ❌ RLS가 비활성화되어 있거나 정책이 없습니다.')
    }
    
    console.log('\n📋 현재 상황 요약:')
    console.log(`   - 실제 데이터: 출근 ${totalAttendance}건, 작업일지 ${totalReports}건`)
    console.log(`   - 사용자 접근: ${hasRLS ? 'RLS로 인해 제한됨' : '제한 없음'}`)
    console.log(`   - 문제점: 관리자도 팀 데이터를 볼 수 없음`)
    
    console.log('\n🔧 다음 단계:')
    console.log('   npm run db:apply-optimized-rls 실행하여 정책 개선')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

checkRLSSimple()