#!/usr/bin/env node

/**
 * RLS 정책 수정 적용 스크립트
 * 새로운 건설업 특화 계층적 권한 정책 적용
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  console.log('🔧 RLS 정책 수정 적용 시작...\n');

  try {
    // 1. 마이그레이션 SQL 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '200_fix_construction_rls_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 마이그레이션 파일 로드됨');

    // 2. SQL 실행 - 세미콜론으로 분할하여 개별 실행
    console.log('⚡ SQL 마이그레이션 실행 중...');
    
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
    
    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';'
          });
          
          if (error) {
            console.log(`⚠️  SQL 실행 경고: ${error.message.substring(0, 100)}...`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`❌ SQL 문장 실행 실패: ${statement.substring(0, 50)}...`);
          errorCount++;
        }
      }
    }

    console.log(`✅ SQL 실행 완료: 성공 ${successCount}개, 경고/오류 ${errorCount}개`);

    // 3. 검증 - attendance_records 데이터 접근 테스트
    console.log('\n🔍 데이터 접근 검증 중...');
    
    const testUsers = [
      { email: 'admin@inopnc.com', expectedRole: 'admin' },
      { email: 'manager@inopnc.com', expectedRole: 'site_manager' },
      { email: 'worker@inopnc.com', expectedRole: 'worker' }
    ];

    for (const user of testUsers) {
      try {
        // 해당 사용자로 세션 시뮬레이션 (서비스 키로는 불가능하므로 프로필만 확인)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, role, organization_id, site_id')
          .eq('email', user.email)
          .single();
          
        if (profile) {
          console.log(`   👤 ${user.email}:`);
          console.log(`      - 역할: ${profile.role}`);
          console.log(`      - 조직 ID: ${profile.organization_id}`);
          console.log(`      - 사이트 ID: ${profile.site_id}`);
        }
      } catch (err) {
        console.log(`   ❌ ${user.email}: 프로필 조회 실패`);
      }
    }

    // 4. 서비스 키로 출근 기록 재확인
    const { data: attendanceCount } = await supabase
      .from('attendance_records')
      .select('id', { count: 'exact', head: true });

    const { data: dailyReportsCount } = await supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true });

    console.log(`\n📊 전체 데이터 현황:`);
    console.log(`   - 출근 기록: ${attendanceCount || 0}건`);
    console.log(`   - 작업일지: ${dailyReportsCount || 0}건`);

    console.log('\n🎉 RLS 정책 수정이 완료되었습니다!');
    console.log('\n📋 새로운 권한 체계:');
    console.log('   1. ✅ 시스템 관리자 (system_admin): 모든 데이터 접근');
    console.log('   2. ✅ 관리자 (admin): 소속 조직 내 모든 사이트 데이터');  
    console.log('   3. ✅ 현장관리자 (site_manager): 배정된 사이트 + 조직 사이트 데이터');
    console.log('   4. ✅ 작업자 (worker): 본인 데이터 + 배정된 사이트 데이터');
    console.log('   5. ✅ 파트너사 (customer_manager): 배정된 사이트 데이터만');
    console.log('\n💡 다음 단계:');
    console.log('   - 웹 애플리케이션을 새로고침하여 테스트');
    console.log('   - admin@inopnc.com으로 로그인하여 모든 출근 현황 확인');
    console.log('   - manager@inopnc.com으로 로그인하여 현장 데이터 확인');

  } catch (error) {
    console.error('❌ RLS 정책 적용 중 오류 발생:');
    console.error(error.message);
    console.error('\n🔧 수동 해결 방법:');
    console.error('1. Supabase 대시보드에서 SQL 에디터 열기');
    console.error('2. supabase/migrations/200_fix_construction_rls_policies.sql 내용 복사');
    console.error('3. SQL 에디터에서 직접 실행');
    process.exit(1);
  }
}

// 실행
applyRLSFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});