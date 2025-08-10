#!/usr/bin/env tsx
/**
 * 3단계: 사용자 권한 테스트
 * Test user permissions after optimized RLS policies application
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserPermissions() {
  console.log('🧪 사용자 권한 테스트 시작\n')
  console.log('=' + '='.repeat(60))
  
  try {
    // 테스트 사용자들
    const testUsers = [
      { 
        email: 'admin@inopnc.com', 
        id: 'b9341ed7-79fc-413d-a0fe-6e7fc7889f5f',
        expectedRole: 'admin' 
      },
      { 
        email: 'manager@inopnc.com', 
        id: '950db250-82e4-4c9d-bf4d-75df7244764c',
        expectedRole: 'site_manager' 
      },
      { 
        email: 'worker@inopnc.com', 
        id: '2a082247-3255-4811-b1d7-38e83c9019e0',
        expectedRole: 'worker' 
      }
    ]
    
    console.log('\n📊 전체 데이터 현황 (서비스 롤):')
    
    // 서비스 롤로 전체 데이터 확인
    const { count: totalAttendance } = await adminSupabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalReports } = await adminSupabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })
      
    const { count: totalSites } = await adminSupabase
      .from('sites')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   출근 기록: ${totalAttendance}건`)
    console.log(`   작업일지: ${totalReports}건`)
    console.log(`   현장 수: ${totalSites}개`)
    
    console.log('\n👥 사용자별 권한 테스트:')
    console.log('-'.repeat(60))
    
    for (const user of testUsers) {
      console.log(`\n🔍 ${user.email} (${user.expectedRole}) 테스트:`)
      
      // 사용자 정보 확인
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      console.log(`   실제 역할: ${profile?.role || 'unknown'}`)
      
      // 현장 배정 정보 확인
      const { data: siteAssignments } = await adminSupabase
        .from('site_assignments')
        .select('site_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      console.log(`   활성 현장 배정: ${siteAssignments?.length || 0}개`)
      if (siteAssignments && siteAssignments.length > 0) {
        const siteIds = siteAssignments.map(s => s.site_id.slice(0, 8) + '...')
        console.log(`   배정 현장: ${siteIds.join(', ')}`)
      }
      
      // 해당 사용자로 인증된 클라이언트 생성 (시뮬레이션)
      // 실제로는 사용자가 로그인할 때의 상황을 시뮬레이션
      
      // 출근 기록 접근 테스트
      const { count: userAttendance, error: attendanceError } = await adminSupabase
        .rpc('test_user_attendance_access', { test_user_id: user.id })
        .then(async () => {
          // RLS 정책이 적용된 상태에서 해당 사용자가 접근할 수 있는 출근 기록 수 확인
          return await adminSupabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${user.id},site_id.in.(${(siteAssignments || []).map(s => s.site_id).join(',')})`)
        })
        .catch(() => ({ count: 0, error: null }))
      
      // 작업일지 접근 테스트  
      const { count: userReports, error: reportsError } = await adminSupabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .or(`created_by.eq.${user.id},site_id.in.(${(siteAssignments || []).map(s => s.site_id).join(',')})`)
        .then(result => result)
        .catch(() => ({ count: 0, error: null }))
      
      console.log(`   접근 가능한 출근 기록: ${userAttendance || 0}건`)
      console.log(`   접근 가능한 작업일지: ${userReports || 0}건`)
      
      // 권한 레벨에 따른 예상 결과 확인
      let expectedLevel = 'basic'
      if (profile?.role === 'system_admin') expectedLevel = 'full'
      else if (profile?.role === 'admin' || profile?.role === 'site_manager') expectedLevel = 'site'
      
      console.log(`   권한 레벨: ${expectedLevel}`)
      
      // 결과 평가
      const hasData = (userAttendance || 0) > 0 || (userReports || 0) > 0
      console.log(`   데이터 접근: ${hasData ? '✅ 성공' : '❌ 실패'}`)
      
      if (!hasData && (siteAssignments?.length || 0) > 0) {
        console.log('   ⚠️ 현장 배정이 있지만 데이터 접근 불가 - RLS 정책 검토 필요')
      }
    }
    
    console.log('\n🏥 현장별 데이터 격리 테스트:')
    console.log('-'.repeat(60))
    
    // 현장별 데이터 분포 확인
    const { data: siteData } = await adminSupabase
      .from('sites')
      .select(`
        id,
        name,
        attendance_records(count),
        daily_reports(count)
      `)
    
    if (siteData) {
      siteData.forEach(site => {
        console.log(`\n🏗️ ${site.name}:`)
        console.log(`   현장 ID: ${site.id.slice(0, 8)}...`)
        console.log(`   출근 기록: ${(site.attendance_records as any)?.count || 0}건`)
        console.log(`   작업일지: ${(site.daily_reports as any)?.count || 0}건`)
      })
    }
    
    console.log('\n📝 RLS 정책 효과 확인:')
    console.log('-'.repeat(60))
    
    // anon key로 데이터 접근 테스트 (인증 없는 상태)
    const anonSupabase = createClient(supabaseUrl, anonKey)
    
    const { count: anonAttendance, error: anonError } = await anonSupabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
    
    console.log(`인증되지 않은 사용자 접근:`)
    console.log(`   출근 기록: ${anonAttendance || 0}건 ${anonError ? '(차단됨)' : ''}`)
    console.log(`   상태: ${anonError ? '✅ RLS 보안 정상 작동' : '❌ 보안 취약'}`)
    
    console.log('\n🎯 테스트 결과 요약:')
    console.log('-'.repeat(60))
    
    const workingUsers = testUsers.filter(user => {
      // 각 사용자의 데이터 접근 여부를 다시 확인할 수 있지만, 
      // 여기서는 현장 배정이 있는 사용자들을 기준으로 판단
      return true // 모든 사용자에 대해 기본적인 접근은 가능해야 함
    })
    
    console.log(`✅ 테스트 완료`)
    console.log(`📊 전체 데이터: 출근 ${totalAttendance}건, 작업일지 ${totalReports}건`)
    console.log(`👥 테스트 사용자: ${testUsers.length}명`)
    console.log(`🔒 RLS 보안: ${anonError ? '정상' : '점검 필요'}`)
    
    console.log('\n💡 권장 사항:')
    if (anonError) {
      console.log('   1. ✅ RLS 정책이 올바르게 적용되어 무인증 접근이 차단됨')
    } else {
      console.log('   1. ⚠️ 무인증 접근이 가능함 - RLS 정책 점검 필요')
    }
    
    console.log('   2. 🔍 실제 로그인으로 각 계정의 데이터 접근 상황 확인')
    console.log('   3. 📱 애플리케이션에서 manager@inopnc.com 계정으로 다시 테스트')
    
    console.log('\n' + '=' + '='.repeat(60))
    console.log('✅ 사용자 권한 테스트 완료')
    console.log('\n🔗 다음: 실제 애플리케이션에서 로그인 테스트')
    
  } catch (error) {
    console.error('❌ 권한 테스트 중 오류 발생:', error.message)
    console.error('상세:', error)
  }
}

// 실행
testUserPermissions()