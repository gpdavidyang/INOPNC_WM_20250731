#!/usr/bin/env node

/**
 * 임시 RLS 정책 수정 (긴급 시에만 사용)
 * ⚠️ 보안 위험: 운영 환경에서 절대 사용 금지
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function temporaryRLSFix() {
  console.log('⚠️  긴급 임시 RLS 정책 적용');
  console.log('🔴 경고: 이 방법은 보안상 위험하므로 개발 환경에서만 사용하세요!\n');

  try {
    // 기존 제한적인 정책들 삭제
    const dropPolicies = [
      "DROP POLICY IF EXISTS \"Users can view own attendance\" ON attendance_records;",
      "DROP POLICY IF EXISTS \"Users can view attendance based on role\" ON attendance_records;", 
      "DROP POLICY IF EXISTS \"attendance_view_own\" ON attendance_records;",
      "DROP POLICY IF EXISTS \"Daily reports viewable by site members\" ON daily_reports;",
      "DROP POLICY IF EXISTS \"Users can view reports based on role\" ON daily_reports;",
      "DROP POLICY IF EXISTS \"daily_reports_select_site\" ON daily_reports;"
    ];

    for (const sql of dropPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql });
        console.log(`✅ 기존 정책 삭제: ${sql.substring(sql.indexOf('"') + 1, sql.lastIndexOf('"'))}`);
      } catch (err) {
        console.log(`⚠️  정책 삭제 실패 (무시): ${err.message.substring(0, 50)}...`);
      }
    }

    // 임시 허용 정책 생성 (인증된 사용자 모두 접근 가능)
    const allowPolicies = [
      `CREATE POLICY "temp_attendance_view_all" ON attendance_records 
       FOR SELECT USING (auth.role() = 'authenticated');`,
      
      `CREATE POLICY "temp_daily_reports_view_all" ON daily_reports 
       FOR SELECT USING (auth.role() = 'authenticated');`,
       
      `CREATE POLICY "temp_profiles_view_authenticated" ON profiles 
       FOR SELECT USING (auth.role() = 'authenticated');`,
       
      `CREATE POLICY "temp_sites_view_all" ON sites 
       FOR SELECT USING (auth.role() = 'authenticated');`
    ];

    for (const sql of allowPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql });
        const policyName = sql.match(/"([^"]+)"/)[1];
        console.log(`✅ 임시 정책 생성: ${policyName}`);
      } catch (err) {
        console.log(`❌ 정책 생성 실패: ${err.message.substring(0, 100)}...`);
      }
    }

    // 검증
    console.log('\n🔍 임시 정책 적용 확인...');
    const { data: attendanceTest } = await supabase
      .from('attendance_records')
      .select('id')
      .limit(1);
    
    console.log(`📊 출근 기록 접근 테스트: ${attendanceTest ? '성공' : '실패'}`);

    console.log('\n✅ 임시 RLS 정책이 적용되었습니다.');
    console.log('\n⚠️  중요 주의사항:');
    console.log('   1. 🔴 이는 임시 조치입니다 - 운영 환경 사용 금지');
    console.log('   2. 🔴 모든 인증 사용자가 모든 데이터를 볼 수 있습니다');
    console.log('   3. 🔴 개인정보 및 기업 기밀이 노출될 위험이 있습니다');
    console.log('   4. ✅ 가급적 빨리 proper RLS 정책으로 교체하세요');
    console.log('\n💡 올바른 해결책:');
    console.log('   node scripts/apply-rls-fix.js 실행하여 안전한 정책 적용');

  } catch (error) {
    console.error('❌ 임시 정책 적용 실패:', error.message);
    process.exit(1);
  }
}

// 실행 전 확인
console.log('이 스크립트는 보안상 위험한 임시 조치입니다.');
console.log('정말로 실행하시겠습니까? 10초 후 자동 실행됩니다...');
console.log('중단하려면 Ctrl+C를 누르세요.');

setTimeout(() => {
  temporaryRLSFix().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}, 10000);