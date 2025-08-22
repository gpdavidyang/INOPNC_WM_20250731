const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yjtnpscnnsnvfsyvajku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'
);

async function fixSiteAssignments() {
  console.log('=== 사이트 할당 문제 해결 시작 ===\n');

  // 1. 실제 테이블 이름 확인
  console.log('1. 테이블 구조 확인:');
  
  // site_memberships 테이블 확인
  const { data: memberships, error: membershipError } = await supabase
    .from('site_memberships')
    .select('*')
    .limit(1);
  
  if (membershipError && membershipError.code === '42P01') {
    console.log('  ❌ site_memberships 테이블이 없음');
  } else if (membershipError) {
    console.log('  ⚠️ site_memberships 에러:', membershipError.message);
  } else {
    console.log('  ✅ site_memberships 테이블 존재');
  }

  // site_assignments 테이블 확인
  const { data: assignments, error: assignmentError } = await supabase
    .from('site_assignments')
    .select('*')
    .limit(1);
  
  if (assignmentError && assignmentError.code === '42P01') {
    console.log('  ❌ site_assignments 테이블이 없음');
  } else if (assignmentError) {
    console.log('  ⚠️ site_assignments 에러:', assignmentError.message);
  } else {
    console.log('  ✅ site_assignments 테이블 존재');
  }

  // 2. 현장관리자 계정 가져오기
  console.log('\n2. 현장관리자 계정 확인:');
  const { data: managers } = await supabase
    .from('profiles')
    .select('*')
    .in('email', ['manager@inopnc.com', 'production@inopnc.com']);

  managers?.forEach(m => {
    console.log(`  • ${m.email} (ID: ${m.id})`);
  });

  // 3. 강남 A현장 가져오기
  console.log('\n3. 강남 A현장 확인:');
  const { data: gangnamSite } = await supabase
    .from('sites')
    .select('*')
    .eq('name', '강남 A현장')
    .single();

  if (gangnamSite) {
    console.log(`  ✅ 강남 A현장 (ID: ${gangnamSite.id})`);
  } else {
    console.log('  ❌ 강남 A현장을 찾을 수 없음');
    return;
  }

  // 4. site_memberships에 할당 생성
  console.log('\n4. 사이트 할당 생성:');
  
  for (const manager of managers || []) {
    // 기존 할당 확인
    const { data: existing } = await supabase
      .from('site_memberships')
      .select('*')
      .eq('user_id', manager.id)
      .eq('site_id', gangnamSite.id)
      .single();

    if (existing) {
      console.log(`  • ${manager.email}: 이미 할당됨`);
    } else {
      // 새 할당 생성
      const { data, error } = await supabase
        .from('site_memberships')
        .insert({
          user_id: manager.id,
          site_id: gangnamSite.id,
          role: 'site_manager',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ ${manager.email} 할당 실패:`, error.message);
      } else {
        console.log(`  ✅ ${manager.email}: 강남 A현장에 할당 완료`);
      }
    }
  }

  // 5. 할당 확인
  console.log('\n5. 최종 할당 확인:');
  for (const manager of managers || []) {
    const { data: finalMemberships } = await supabase
      .from('site_memberships')
      .select('site_id')
      .eq('user_id', manager.id);

    console.log(`  • ${manager.email}: ${finalMemberships?.length || 0}개 사이트 할당`);
  }

  console.log('\n=== 사이트 할당 완료 ===');
}

fixSiteAssignments().catch(console.error);