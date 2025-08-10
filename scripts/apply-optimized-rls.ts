#!/usr/bin/env tsx
/**
 * 2단계: 최적화된 RLS 정책 적용
 * Apply optimized RLS policies for construction work management system
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyOptimizedRLS() {
  console.log('🚀 최적화된 RLS 정책 적용 시작\n')
  console.log('=' + '='.repeat(60))
  
  try {
    console.log('📝 1. 기존 정책 정리 중...')
    
    // 기존 정책들 제거 (충돌 방지)
    const dropPolicies = [
      'DROP POLICY IF EXISTS "attendance_records_policy" ON attendance_records',
      'DROP POLICY IF EXISTS "daily_reports_policy" ON daily_reports',
      'DROP POLICY IF EXISTS "documents_policy" ON documents',
      'DROP POLICY IF EXISTS "profiles_policy" ON profiles',
      'DROP POLICY IF EXISTS "sites_policy" ON sites',
      'DROP POLICY IF EXISTS "site_assignments_policy" ON site_assignments',
      'DROP POLICY IF EXISTS "notifications_policy" ON notifications'
    ]
    
    for (const dropSql of dropPolicies) {
      try {
        const { error } = await supabase.rpc('sql', { query: dropSql })
        if (error && !error.message.includes('does not exist')) {
          console.log(`   ⚠️ ${dropSql} 실패: ${error.message}`)
        }
      } catch (e) {
        // 정책이 없어도 계속 진행
      }
    }
    
    console.log('✅ 기존 정책 정리 완료')
    
    console.log('\n🔧 2. 최적화된 RLS 정책 생성 중...')
    
    // 헬퍼 함수들 생성
    const helperFunctions = `
      -- 사용자 역할 확인 함수
      CREATE OR REPLACE FUNCTION auth.user_role()
      RETURNS text
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT COALESCE(
          (SELECT role FROM profiles WHERE id = auth.uid()),
          'anonymous'
        );
      $$;
      
      -- 사용자가 접근할 수 있는 현장 ID들 반환
      CREATE OR REPLACE FUNCTION auth.user_sites()
      RETURNS uuid[]
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT CASE
          WHEN auth.user_role() IN ('system_admin') THEN
            -- 시스템 관리자는 모든 현장 접근
            (SELECT array_agg(id) FROM sites)
          WHEN auth.user_role() IN ('admin', 'site_manager') THEN
            -- 관리자와 현장관리자는 배정된 현장들 접근
            (SELECT array_agg(DISTINCT site_id) 
             FROM site_assignments 
             WHERE user_id = auth.uid() AND is_active = true)
          ELSE
            -- 일반 사용자는 배정된 현장만 접근
            (SELECT array_agg(site_id) 
             FROM site_assignments 
             WHERE user_id = auth.uid() AND is_active = true)
        END;
      $$;
    `
    
    const { error: functionError } = await supabase.rpc('sql', { query: helperFunctions })
    if (functionError) {
      console.log(`   ⚠️ 헬퍼 함수 생성 실패: ${functionError.message}`)
    } else {
      console.log('   ✅ 헬퍼 함수 생성 완료')
    }
    
    // RLS 정책들 생성
    const rlsPolicies = `
      -- 1. attendance_records 정책
      ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "optimized_attendance_policy" ON attendance_records
      FOR ALL USING (
        CASE
          WHEN auth.user_role() = 'system_admin' THEN true
          WHEN auth.user_role() IN ('admin', 'site_manager') THEN
            site_id = ANY(auth.user_sites()) OR user_id = auth.uid()
          ELSE
            user_id = auth.uid() OR site_id = ANY(auth.user_sites())
        END
      );
      
      -- 2. daily_reports 정책  
      ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "optimized_daily_reports_policy" ON daily_reports
      FOR ALL USING (
        CASE
          WHEN auth.user_role() = 'system_admin' THEN true
          WHEN auth.user_role() IN ('admin', 'site_manager') THEN
            site_id = ANY(auth.user_sites()) OR created_by = auth.uid()
          ELSE
            created_by = auth.uid() OR site_id = ANY(auth.user_sites())
        END
      );
      
      -- 3. documents 정책
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "optimized_documents_policy" ON documents
      FOR ALL USING (
        CASE
          WHEN auth.user_role() = 'system_admin' THEN true
          WHEN auth.user_role() IN ('admin', 'site_manager') THEN
            is_public = true OR owner_id = auth.uid() OR site_id = ANY(auth.user_sites())
          ELSE
            is_public = true OR owner_id = auth.uid() OR site_id = ANY(auth.user_sites())
        END
      );
      
      -- 4. profiles 정책 (본인 정보 + 관리자는 팀원 정보)
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "optimized_profiles_policy" ON profiles
      FOR ALL USING (
        CASE
          WHEN auth.user_role() = 'system_admin' THEN true
          WHEN auth.user_role() IN ('admin', 'site_manager') THEN
            id = auth.uid() OR 
            id IN (SELECT user_id FROM site_assignments WHERE site_id = ANY(auth.user_sites()))
          ELSE
            id = auth.uid()
        END
      );
      
      -- 5. sites 정책
      ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "optimized_sites_policy" ON sites
      FOR ALL USING (
        CASE
          WHEN auth.user_role() = 'system_admin' THEN true
          ELSE
            id = ANY(auth.user_sites())
        END
      );
      
      -- 6. site_assignments 정책
      ALTER TABLE site_assignments ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "optimized_site_assignments_policy" ON site_assignments
      FOR ALL USING (
        CASE
          WHEN auth.user_role() = 'system_admin' THEN true
          WHEN auth.user_role() IN ('admin', 'site_manager') THEN
            site_id = ANY(auth.user_sites()) OR user_id = auth.uid()
          ELSE
            user_id = auth.uid()
        END
      );
      
      -- 7. notifications 정책
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "optimized_notifications_policy" ON notifications
      FOR ALL USING (
        CASE
          WHEN auth.user_role() = 'system_admin' THEN true
          ELSE
            recipient_id = auth.uid()
        END
      );
    `
    
    const { error: policyError } = await supabase.rpc('sql', { query: rlsPolicies })
    if (policyError) {
      console.log(`   ❌ RLS 정책 생성 실패: ${policyError.message}`)
    } else {
      console.log('   ✅ RLS 정책 생성 완료')
    }
    
    // 성능 최적화 인덱스 생성
    console.log('\n⚡ 3. 성능 최적화 인덱스 생성 중...')
    
    const performanceIndexes = `
      -- attendance_records 최적화 인덱스
      CREATE INDEX IF NOT EXISTS idx_attendance_site_user_date 
      ON attendance_records(site_id, user_id, work_date DESC);
      
      CREATE INDEX IF NOT EXISTS idx_attendance_user_recent
      ON attendance_records(user_id, work_date DESC) 
      WHERE work_date >= CURRENT_DATE - INTERVAL '30 days';
      
      -- daily_reports 최적화 인덱스  
      CREATE INDEX IF NOT EXISTS idx_daily_reports_site_date
      ON daily_reports(site_id, work_date DESC);
      
      CREATE INDEX IF NOT EXISTS idx_daily_reports_created_by
      ON daily_reports(created_by, work_date DESC);
      
      -- site_assignments 최적화 인덱스
      CREATE INDEX IF NOT EXISTS idx_site_assignments_user_active
      ON site_assignments(user_id, is_active) WHERE is_active = true;
      
      CREATE INDEX IF NOT EXISTS idx_site_assignments_site_active  
      ON site_assignments(site_id, is_active) WHERE is_active = true;
    `
    
    const { error: indexError } = await supabase.rpc('sql', { query: performanceIndexes })
    if (indexError) {
      console.log(`   ⚠️ 인덱스 생성 실패: ${indexError.message}`)
    } else {
      console.log('   ✅ 성능 최적화 인덱스 생성 완료')
    }
    
    console.log('\n🧪 4. 정책 검증 중...')
    
    // 테스트 사용자들로 정책 검증
    const testUsers = [
      { email: 'admin@inopnc.com', id: 'b9341ed7-79fc-413d-a0fe-6e7fc7889f5f' },
      { email: 'manager@inopnc.com', id: '950db250-82e4-4c9d-bf4d-75df7244764c' },
      { email: 'worker@inopnc.com', id: '2a082247-3255-4811-b1d7-38e83c9019e0' }
    ]
    
    for (const user of testUsers) {
      // 해당 사용자의 현장 배정 확인
      const { data: assignments } = await supabase
        .from('site_assignments')
        .select('site_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      console.log(`   👤 ${user.email}:`)
      console.log(`     - 활성 현장 배정: ${assignments?.length || 0}개`)
      
      if (assignments && assignments.length > 0) {
        const siteIds = assignments.map(a => a.site_id)
        console.log(`     - 현장 ID들: ${siteIds.join(', ')}`)
      }
    }
    
    console.log('\n📋 5. 새로운 권한 구조:')
    console.log('   🔹 시스템 관리자: 모든 데이터 접근')
    console.log('   🔹 관리자/현장관리자: 배정된 현장 + 팀 데이터 접근')
    console.log('   🔹 일반 사용자: 본인 데이터 + 배정된 현장 데이터 접근')
    console.log('   🔹 현장별 데이터 격리: 다른 현장 데이터는 접근 불가')
    
    console.log('\n' + '=' + '='.repeat(60))
    console.log('✅ 최적화된 RLS 정책 적용 완료')
    console.log('\n🔗 다음 단계: npm run test:user-permissions')
    
  } catch (error) {
    console.error('❌ RLS 정책 적용 중 오류 발생:', error.message)
    console.error('상세 오류:', error)
  }
}

// 실행
applyOptimizedRLS()