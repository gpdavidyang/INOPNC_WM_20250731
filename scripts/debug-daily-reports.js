#!/usr/bin/env node

/**
 * daily_reports 테이블 400 오류 디버깅 스크립트
 */
const fs = require('fs');
const { createReadStream } = require('fs');

console.log('🔍 daily_reports 테이블 오류 디버깅 시작...\n');

// 1. 스키마 분석
console.log('📋 1. 스키마 분석:');
const schemaFiles = [
  './supabase/migrations/001_construction_worklog_schema.sql',
  './supabase/migrations/101_complete_construction_schema.sql',
  './supabase/migrations/102_fix_authentication_system.sql',
  './supabase/migrations/105_enhanced_rls_policies.sql'
];

let dailyReportsTableCreated = false;
let rlsPolicies = [];

schemaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // daily_reports 테이블 생성 확인
    if (content.includes('CREATE TABLE') && content.includes('daily_reports')) {
      console.log(`✅ ${file}: daily_reports 테이블 정의 발견`);
      dailyReportsTableCreated = true;
      
      // report_date 필드 확인
      if (content.includes('report_date DATE')) {
        console.log('   ✅ report_date 필드 존재');
      } else {
        console.log('   ❌ report_date 필드 없음');
      }
    }
    
    // RLS 정책 수집
    const policyMatches = content.match(/CREATE POLICY.*daily_reports[^;]*;/g);
    if (policyMatches) {
      policyMatches.forEach(policy => {
        rlsPolicies.push({
          file: file,
          policy: policy.substring(0, 100) + '...'
        });
      });
    }
  }
});

console.log(`\n📊 2. RLS 정책 분석 (${rlsPolicies.length}개 정책 발견):`);
rlsPolicies.forEach((item, index) => {
  console.log(`${index + 1}. ${item.file}`);
  console.log(`   ${item.policy}`);
});

// 3. 잠재적 문제점 분석
console.log('\n🔍 3. 잠재적 문제점 분석:');

if (!dailyReportsTableCreated) {
  console.log('❌ daily_reports 테이블이 생성되지 않았을 수 있습니다.');
}

if (rlsPolicies.length > 5) {
  console.log('⚠️  RLS 정책이 너무 많아 충돌할 수 있습니다.');
}

// 4. 해결방안 제시
console.log('\n💡 4. 해결방안:');
console.log('1. RLS 정책 간소화 및 통합');
console.log('2. user_site_ids() 함수 확인');
console.log('3. 인증 상태 확인');
console.log('4. profiles 테이블의 site_id 관계 확인');

// 5. 테스트 쿼리 제안
console.log('\n🧪 5. 테스트 쿼리 제안:');
console.log(`
-- 1. 테이블 존재 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'daily_reports'
);

-- 2. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'daily_reports';

-- 3. 현재 사용자 확인
SELECT auth.uid(), auth.role();

-- 4. profiles 테이블 확인
SELECT id, role, site_id FROM profiles WHERE id = auth.uid();
`);

console.log('\n✅ 디버깅 분석 완료');
console.log('브라우저 개발자 도구에서 정확한 에러 메시지를 확인하세요.');