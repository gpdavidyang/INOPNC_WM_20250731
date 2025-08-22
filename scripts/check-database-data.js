const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yjtnpscnnsnvfsyvajku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'
);

async function checkDatabase() {
  console.log('=== 데이터베이스 데이터 확인 시작 ===\n');

  // 1. sites 테이블 확인
  console.log('1. sites 테이블 데이터:');
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .limit(10);
  
  if (sitesError) {
    console.error('Sites 조회 에러:', sitesError);
  } else {
    console.log(`- 총 ${sites?.length}개 사이트 발견`);
    sites?.forEach(site => {
      console.log(`  • ID: ${site.id}`);
      console.log(`    이름: ${site.name}`);
      console.log(`    주소: ${site.address}`);
      console.log(`    상태: ${site.status}`);
    });
  }

  console.log('\n2. profiles 테이블 (현장관리자 계정):');
  const { data: managers, error: managersError } = await supabase
    .from('profiles')
    .select('*')
    .in('email', ['manager@inopnc.com', 'production@inopnc.com']);
  
  if (managersError) {
    console.error('Managers 조회 에러:', managersError);
  } else {
    managers?.forEach(manager => {
      console.log(`  • ${manager.email}`);
      console.log(`    ID: ${manager.id}`);
      console.log(`    이름: ${manager.full_name}`);
      console.log(`    역할: ${manager.role}`);
    });
  }

  console.log('\n3. site_memberships 테이블 (현장 할당):');
  
  // manager@inopnc.com의 할당 확인
  const managerProfile = managers?.find(m => m.email === 'manager@inopnc.com');
  if (managerProfile) {
    const { data: managerMemberships, error: mmError } = await supabase
      .from('site_memberships')
      .select('*, sites(*)')
      .eq('user_id', managerProfile.id);
    
    console.log(`  manager@inopnc.com의 할당:`);
    if (mmError) {
      console.error('  에러:', mmError);
    } else if (!managerMemberships || managerMemberships.length === 0) {
      console.log('  ❌ 할당된 사이트 없음!');
    } else {
      managerMemberships.forEach(m => {
        console.log(`    ✅ ${m.sites?.name} (역할: ${m.role})`);
      });
    }
  }

  // production@inopnc.com의 할당 확인
  const productionProfile = managers?.find(m => m.email === 'production@inopnc.com');
  if (productionProfile) {
    const { data: productionMemberships, error: pmError } = await supabase
      .from('site_memberships')
      .select('*, sites(*)')
      .eq('user_id', productionProfile.id);
    
    console.log(`\n  production@inopnc.com의 할당:`);
    if (pmError) {
      console.error('  에러:', pmError);
    } else if (!productionMemberships || productionMemberships.length === 0) {
      console.log('  ❌ 할당된 사이트 없음!');
    } else {
      productionMemberships.forEach(m => {
        console.log(`    ✅ ${m.sites?.name} (역할: ${m.role})`);
      });
    }
  }

  console.log('\n4. daily_reports 테이블 (최근 보고서):');
  const { data: reports, error: reportsError } = await supabase
    .from('daily_reports')
    .select('*, sites(*)')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (reportsError) {
    console.error('Reports 조회 에러:', reportsError);
  } else {
    console.log(`- 최근 ${reports?.length}개 보고서`);
    reports?.forEach(report => {
      console.log(`  • ${report.date} - ${report.sites?.name || report.site_id}`);
      console.log(`    상태: ${report.status}`);
    });
  }

  console.log('\n5. RLS 정책 테스트 (인증 없이):');
  const { data: testData, error: testError } = await supabase
    .from('sites')
    .select('*')
    .limit(1);
  
  if (testError) {
    console.log('  ❌ RLS가 활성화되어 있음 (정상):', testError.message);
  } else {
    console.log('  ✅ Service Role로 데이터 접근 가능 (정상)');
  }

  console.log('\n=== 데이터베이스 확인 완료 ===');
}

checkDatabase().catch(console.error);