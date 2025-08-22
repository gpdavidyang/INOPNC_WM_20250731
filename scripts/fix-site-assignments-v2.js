const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yjtnpscnnsnvfsyvajku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'
);

async function fixSiteAssignments() {
  console.log('=== site_assignments 테이블로 사이트 할당 ===\n');

  // 1. 현장관리자 계정 가져오기
  console.log('1. 현장관리자 계정:');
  const { data: managers } = await supabase
    .from('profiles')
    .select('*')
    .in('email', ['manager@inopnc.com', 'production@inopnc.com']);

  managers?.forEach(m => {
    console.log(`  • ${m.email} (ID: ${m.id}, Role: ${m.role})`);
  });

  // 2. 강남 A현장 찾기 (첫 번째 것 사용)
  console.log('\n2. 사용 가능한 사이트:');
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .like('name', '%강남%')
    .eq('status', 'active');

  let targetSite = sites?.[0]; // 첫 번째 강남 사이트 사용
  
  if (!targetSite) {
    // 강남 사이트가 없으면 아무 active 사이트 사용
    const { data: anySite } = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single();
    targetSite = anySite;
  }

  if (targetSite) {
    console.log(`  ✅ 할당할 사이트: ${targetSite.name} (ID: ${targetSite.id})`);
  } else {
    console.log('  ❌ 사용 가능한 사이트가 없음');
    return;
  }

  // 3. site_assignments에 할당 생성
  console.log('\n3. site_assignments 테이블에 할당:');
  
  for (const manager of managers || []) {
    // 기존 할당 확인
    const { data: existing, error: checkError } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', manager.id)
      .eq('site_id', targetSite.id);

    if (checkError) {
      console.error(`  ❌ 확인 에러:`, checkError.message);
      continue;
    }

    if (existing && existing.length > 0) {
      console.log(`  • ${manager.email}: 이미 ${targetSite.name}에 할당됨`);
    } else {
      // 새 할당 생성
      const { data, error } = await supabase
        .from('site_assignments')
        .insert({
          user_id: manager.id,
          site_id: targetSite.id,
          assigned_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error(`  ❌ ${manager.email} 할당 실패:`, error.message);
      } else {
        console.log(`  ✅ ${manager.email}: ${targetSite.name}에 할당 완료`);
      }
    }
  }

  // 4. 최종 할당 확인
  console.log('\n4. 최종 할당 상태:');
  for (const manager of managers || []) {
    const { data: assignments, error } = await supabase
      .from('site_assignments')
      .select(`
        *,
        sites:site_id (name, address)
      `)
      .eq('user_id', manager.id);

    if (error) {
      console.error(`  ❌ 조회 에러:`, error.message);
    } else {
      console.log(`  • ${manager.email}의 할당된 사이트:`);
      if (!assignments || assignments.length === 0) {
        console.log('    - 할당된 사이트 없음');
      } else {
        assignments.forEach(a => {
          console.log(`    - ${a.sites?.name || a.site_id}`);
        });
      }
    }
  }

  console.log('\n=== 할당 완료 ===');
}

fixSiteAssignments().catch(console.error);