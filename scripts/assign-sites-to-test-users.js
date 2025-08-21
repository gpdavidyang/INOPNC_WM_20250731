const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function assignSitesToTestUsers() {
  try {
    console.log('🚀 테스트 사용자들에게 현장 배정 시작...');

    // 1. 모든 현장 조회 (여러 개의 강남 A현장이 있을 수 있음)
    const { data: sites, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('name', '강남 A현장')
      .order('created_at', { ascending: false })
      .limit(1);

    if (siteError || !sites || sites.length === 0) {
      console.error('❌ 강남 A현장을 찾을 수 없습니다:', siteError);
      
      // 대체: 첫 번째 활성 현장 선택
      const { data: anySite, error: anySiteError } = await supabase
        .from('sites')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (anySiteError || !anySite || anySite.length === 0) {
        console.error('❌ 활성 현장이 없습니다');
        return;
      }

      console.log('ℹ️ 대체 현장 사용:', anySite[0].name);
      sites[0] = anySite[0];
    }

    const site = sites[0];
    console.log('✅ 현장 찾음:', site.name, '(ID:', site.id, ')');

    // 2. 테스트 사용자들의 프로필 조회
    const testEmails = ['worker@inopnc.com', 'customer@inopnc.com'];
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('email', testEmails);

    if (profileError || !profiles || profiles.length === 0) {
      console.error('❌ 테스트 사용자들을 찾을 수 없습니다:', profileError);
      return;
    }

    console.log(`✅ ${profiles.length}명의 테스트 사용자 찾음`);
    profiles.forEach(p => console.log(`  - ${p.email} (${p.full_name}, 역할: ${p.role})`));

    // 3. 각 사용자에게 현장 배정
    for (const profile of profiles) {
      console.log(`\n📋 처리 중: ${profile.email} (${profile.full_name})`);

      // 기존 활성 배정 확인
      const { data: existingAssignments, error: checkError } = await supabase
        .from('site_assignments')
        .select('*')
        .eq('user_id', profile.id)
        .eq('site_id', site.id)
        .eq('is_active', true);

      if (existingAssignments && existingAssignments.length > 0) {
        console.log(`  ℹ️ 이미 배정됨 - 배정 날짜 업데이트`);
        
        // 기존 배정 업데이트 (1개월 연장)
        const { error: updateError } = await supabase
          .from('site_assignments')
          .update({
            assigned_date: new Date().toISOString(),
            unassigned_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAssignments[0].id);

        if (updateError) {
          console.error(`  ❌ 업데이트 실패:`, updateError);
        } else {
          console.log(`  ✅ 배정 기간 연장 완료 (30일)`);
        }
      } else {
        // 기존 모든 활성 배정들을 먼저 비활성화
        const { error: deactivateError } = await supabase
          .from('site_assignments')
          .update({
            is_active: false,
            unassigned_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', profile.id)
          .eq('is_active', true);

        if (deactivateError) {
          console.warn(`  ⚠️ 기존 배정 비활성화 중 경고:`, deactivateError.message);
        }

        // 새로운 배정 생성
        const assignmentRole = profile.role === 'customer_manager' ? 'supervisor' : 'worker';
        
        const newAssignment = {
          site_id: site.id,
          user_id: profile.id,
          assigned_date: new Date().toISOString(),
          unassigned_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
          role: assignmentRole,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: inserted, error: insertError } = await supabase
          .from('site_assignments')
          .insert(newAssignment)
          .select();

        if (insertError) {
          console.error(`  ❌ 신규 배정 실패:`, insertError);
        } else {
          console.log(`  ✅ 신규 배정 완료 (역할: ${assignmentRole}, 기간: 30일)`);
          console.log(`     배정 ID: ${inserted[0].id}`);
        }
      }
    }

    // 4. 배정 결과 확인
    console.log('\n📊 최종 배정 현황 확인...');
    
    const { data: finalAssignments, error: finalError } = await supabase
      .from('site_assignments')
      .select(`
        *,
        profiles!inner(email, full_name, role),
        sites!inner(name, address)
      `)
      .in('user_id', profiles.map(p => p.id))
      .eq('site_id', site.id)
      .eq('is_active', true);

    if (finalError) {
      console.error('❌ 최종 확인 실패:', finalError);
    } else if (finalAssignments && finalAssignments.length > 0) {
      console.log(`\n✅ 배정 완료된 사용자들:`);
      finalAssignments.forEach(assignment => {
        const endDate = new Date(assignment.unassigned_date);
        const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 1000 * 24));
        console.log(`  - ${assignment.profiles.email}:`);
        console.log(`    • 현장: ${assignment.sites.name}`);
        console.log(`    • 역할: ${assignment.role === 'supervisor' ? '감독관' : '작업자'}`);
        console.log(`    • 남은 기간: ${daysRemaining}일`);
      });
    } else {
      console.log('⚠️ 배정된 사용자가 없습니다');
    }

    console.log('\n✨ 모든 작업 완료!');
    console.log('ℹ️ 사용자들이 다시 로그인하면 현장 정보가 표시됩니다.');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
assignSitesToTestUsers();