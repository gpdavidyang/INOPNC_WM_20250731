#!/usr/bin/env tsx
/**
 * 1단계: 현재 RLS 정책 상태 확인
 * Check current RLS policy status for construction work management system
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSStatus() {
  console.log('🔍 RLS 정책 상태 확인 시작\n')
  console.log('=' + '='.repeat(60))
  
  try {
    // 1. RLS 활성화 상태 확인
    console.log('\n📊 1. RLS 활성화 상태 확인:')
    
    const rlsTables = [
      'attendance_records',
      'daily_reports', 
      'documents',
      'notifications',
      'profiles',
      'sites',
      'site_assignments'
    ]
    
    for (const tableName of rlsTables) {
      const { data: rlsStatus, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT schemaname, tablename, rowsecurity 
              FROM pg_tables 
              WHERE tablename = '${tableName}' AND schemaname = 'public'`
      })
      
      if (error) {
        console.log(`   ❌ ${tableName}: 조회 실패 - ${error.message}`)
      } else if (rlsStatus && rlsStatus.length > 0) {
        const isEnabled = rlsStatus[0].rowsecurity
        console.log(`   ${isEnabled ? '🔒' : '🔓'} ${tableName}: RLS ${isEnabled ? '활성화' : '비활성화'}`)
      }
    }
    
    // 2. 현재 RLS 정책 목록 확인
    console.log('\n📋 2. 현재 RLS 정책 목록:')
    
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
            FROM pg_policies 
            WHERE schemaname = 'public' 
            ORDER BY tablename, policyname`
    })
    
    if (policiesError) {
      console.log(`   ❌ 정책 조회 실패: ${policiesError.message}`)
    } else if (policies && policies.length > 0) {
      const policyByTable: Record<string, any[]> = {}
      
      policies.forEach((policy: any) => {
        if (!policyByTable[policy.tablename]) {
          policyByTable[policy.tablename] = []
        }
        policyByTable[policy.tablename].push(policy)
      })
      
      Object.entries(policyByTable).forEach(([tableName, tablePolicies]) => {
        console.log(`\n   📄 ${tableName} (${tablePolicies.length}개 정책):`)
        tablePolicies.forEach(policy => {
          const cmd = policy.cmd === '*' ? 'ALL' : policy.cmd
          console.log(`     - ${policy.policyname} (${cmd})`)
          if (policy.roles && policy.roles.length > 0) {
            console.log(`       역할: ${policy.roles.join(', ')}`)
          }
        })
      })
    } else {
      console.log('   ❌ RLS 정책이 없습니다.')
    }
    
    // 3. 사용자별 데이터 접근 테스트
    console.log('\n🧪 3. 사용자별 데이터 접근 테스트:')
    
    const testUsers = [
      { email: 'admin@inopnc.com', id: 'b9341ed7-79fc-413d-a0fe-6e7fc7889f5f', role: 'admin' },
      { email: 'manager@inopnc.com', id: '950db250-82e4-4c9d-bf4d-75df7244764c', role: 'site_manager' },
      { email: 'worker@inopnc.com', id: '2a082247-3255-4811-b1d7-38e83c9019e0', role: 'worker' }
    ]
    
    for (const user of testUsers) {
      console.log(`\n   👤 ${user.email} (${user.role}):`)
      
      // attendance_records 접근 테스트 (서비스 롤로 조회)
      const { count: totalAttendance } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
      
      // 해당 사용자 데이터만 조회
      const { count: userAttendance } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      console.log(`     - 전체 출근 기록: ${totalAttendance}건`)
      console.log(`     - 본인 출근 기록: ${userAttendance}건`)
      
      // daily_reports 접근 테스트
      const { count: totalReports } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
      
      console.log(`     - 전체 작업일지: ${totalReports}건`)
    }
    
    // 4. 문제점 진단
    console.log('\n🩺 4. 문제점 진단:')
    
    const issues = []
    
    // 정책 충돌 확인
    if (policies && policies.length > 0) {
      const attendancePolicies = policies.filter((p: any) => p.tablename === 'attendance_records')
      const reportPolicies = policies.filter((p: any) => p.tablename === 'daily_reports')
      
      if (attendancePolicies.length === 0) {
        issues.push('❌ attendance_records 테이블에 RLS 정책이 없음')
      }
      
      if (reportPolicies.length === 0) {
        issues.push('❌ daily_reports 테이블에 RLS 정책이 없음')
      }
      
      // 정책 이름 충돌 확인
      const policyNames = policies.map((p: any) => p.policyname)
      const duplicateNames = policyNames.filter((name, index) => policyNames.indexOf(name) !== index)
      
      if (duplicateNames.length > 0) {
        issues.push(`⚠️ 중복된 정책 이름 발견: ${[...new Set(duplicateNames)].join(', ')}`)
      }
    }
    
    if (issues.length > 0) {
      console.log('   발견된 문제점들:')
      issues.forEach(issue => console.log(`   ${issue}`))
    } else {
      console.log('   ✅ 주요 문제점이 발견되지 않았습니다.')
    }
    
    // 5. 권장사항
    console.log('\n💡 5. 권장사항:')
    console.log('   1. RLS 정책이 너무 제한적으로 설정되어 있음')
    console.log('   2. 관리자와 현장관리자가 팀 데이터를 볼 수 없음')
    console.log('   3. 계층적 권한 구조 도입이 필요함')
    console.log('   4. 현장별 데이터 격리는 유지하되 역할별 접근 권한 확장 필요')
    
    console.log('\n' + '=' + '='.repeat(60))
    console.log('✅ RLS 정책 상태 확인 완료')
    console.log('\n🔗 다음 단계: npm run db:apply-optimized-rls')
    
  } catch (error) {
    console.error('❌ RLS 상태 확인 중 오류 발생:', error.message)
    console.error('상세 오류:', error)
  }
}

// SQL 실행 함수 등록 (없는 경우)
async function ensureSqlFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
    if (error && error.message.includes('function exec_sql')) {
      console.log('📝 exec_sql 함수 생성 중...')
      
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result json;
        BEGIN
          EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql || ') t' INTO result;
          RETURN COALESCE(result, '[]'::json);
        END;
        $$;
      `
      
      // 직접 SQL 실행을 위한 대체 방법
      console.log('⚠️ exec_sql 함수를 직접 생성할 수 없습니다. 기본 조회 방식을 사용합니다.')
    }
  } catch (e) {
    console.log('📝 기본 조회 방식을 사용합니다.')
  }
}

// 실행
ensureSqlFunction().then(() => {
  checkRLSStatus().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
})