const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function implementDataIntegrityChecks() {
  console.log('🔧 FK 제약조건 대안 구현 시작...');
  console.log('='.repeat(60));
  
  try {
    // 1. 각 테이블의 무결성을 개별적으로 검증
    console.log('\n1️⃣ 데이터 무결성 개별 검증...');
    
    const integrityChecks = [
      {
        name: 'profiles orphaned from auth.users',
        check: async () => {
          // profiles 테이블에서 auth.users에 존재하지 않는 records
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, email');
            
          if (error) throw error;
          
          const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
          if (authError) throw authError;
          
          const authIds = users.map(u => u.id);
          const orphanedProfiles = profiles.filter(p => !authIds.includes(p.id));
          
          return {
            totalChecked: profiles.length,
            orphaned: orphanedProfiles.length,
            orphanedItems: orphanedProfiles
          };
        }
      },
      {
        name: 'site_assignments orphaned user_ids',
        check: async () => {
          const { data: assignments, error } = await supabase
            .from('site_assignments')
            .select('id, user_id');
            
          if (error) throw error;
          
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id');
            
          if (profileError) throw profileError;
          
          const profileIds = profiles.map(p => p.id);
          const orphaned = assignments.filter(a => a.user_id && !profileIds.includes(a.user_id));
          
          return {
            totalChecked: assignments.length,
            orphaned: orphaned.length,
            orphanedItems: orphaned
          };
        }
      },
      {
        name: 'site_assignments orphaned site_ids',
        check: async () => {
          const { data: assignments, error } = await supabase
            .from('site_assignments')
            .select('id, site_id');
            
          if (error) throw error;
          
          const { data: sites, error: siteError } = await supabase
            .from('sites')
            .select('id');
            
          if (siteError) throw siteError;
          
          const siteIds = sites.map(s => s.id);
          const orphaned = assignments.filter(a => a.site_id && !siteIds.includes(a.site_id));
          
          return {
            totalChecked: assignments.length,
            orphaned: orphaned.length,
            orphanedItems: orphaned
          };
        }
      },
      {
        name: 'daily_reports orphaned site_ids',
        check: async () => {
          const { data: reports, error } = await supabase
            .from('daily_reports')
            .select('id, site_id');
            
          if (error) throw error;
          
          const { data: sites, error: siteError } = await supabase
            .from('sites')
            .select('id');
            
          if (siteError) throw siteError;
          
          const siteIds = sites.map(s => s.id);
          const orphaned = reports.filter(r => r.site_id && !siteIds.includes(r.site_id));
          
          return {
            totalChecked: reports.length,
            orphaned: orphaned.length,
            orphanedItems: orphaned
          };
        }
      },
      {
        name: 'daily_reports orphaned created_by',
        check: async () => {
          const { data: reports, error } = await supabase
            .from('daily_reports')
            .select('id, created_by');
            
          if (error) throw error;
          
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id');
            
          if (profileError) throw profileError;
          
          const profileIds = profiles.map(p => p.id);
          const orphaned = reports.filter(r => r.created_by && !profileIds.includes(r.created_by));
          
          return {
            totalChecked: reports.length,
            orphaned: orphaned.length,
            orphanedItems: orphaned
          };
        }
      },
      {
        name: 'documents orphaned owner_ids',
        check: async () => {
          const { data: docs, error } = await supabase
            .from('documents')
            .select('id, owner_id');
            
          if (error) throw error;
          
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id');
            
          if (profileError) throw profileError;
          
          const profileIds = profiles.map(p => p.id);
          const orphaned = docs.filter(d => d.owner_id && !profileIds.includes(d.owner_id));
          
          return {
            totalChecked: docs.length,
            orphaned: orphaned.length,
            orphanedItems: orphaned
          };
        }
      }
    ];
    
    const results = [];
    for (const check of integrityChecks) {
      console.log(`  ⏳ 검증 중: ${check.name}`);
      try {
        const result = await check.check();
        results.push({ name: check.name, ...result });
        
        if (result.orphaned > 0) {
          console.log(`    ⚠️ 발견: ${result.orphaned}개 orphaned records`);
        } else {
          console.log(`    ✅ 무결성 OK: ${result.totalChecked}개 records`);
        }
      } catch (error) {
        console.log(`    ❌ 오류: ${error.message}`);
        results.push({ name: check.name, error: error.message });
      }
    }
    
    // 2. 결과 요약 출력
    console.log('\n2️⃣ 무결성 검증 결과 요약...');
    console.log('='.repeat(40));
    
    let totalOrphaned = 0;
    let cleanTables = 0;
    
    results.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.name}: 오류 발생`);
      } else if (result.orphaned === 0) {
        console.log(`✅ ${result.name}: 무결성 OK`);
        cleanTables++;
      } else {
        console.log(`🔴 ${result.name}: ${result.orphaned}개 문제 발견`);
        totalOrphaned += result.orphaned;
      }
    });
    
    console.log('\n📊 전체 요약:');
    console.log(`  깨끗한 테이블: ${cleanTables}/${results.length}`);
    console.log(`  총 orphaned records: ${totalOrphaned}개`);
    
    // 3. 발견된 orphaned records 정리 제안
    if (totalOrphaned > 0) {
      console.log('\n3️⃣ Orphaned Records 정리...');
      
      for (const result of results) {
        if (result.orphaned > 0) {
          console.log(`\n🧹 ${result.name} 정리 중...`);
          console.log(`  발견된 문제: ${result.orphaned}개`);
          
          // 각 유형별로 실제 정리 수행
          try {
            await cleanupOrphanedRecords(result.name, result.orphanedItems);
            console.log(`  ✅ 정리 완료`);
          } catch (error) {
            console.log(`  ❌ 정리 실패: ${error.message}`);
          }
        }
      }
    }
    
    // 4. 최종 무결성 재검증
    console.log('\n4️⃣ 정리 후 최종 검증...');
    let finalOrphaned = 0;
    
    for (const check of integrityChecks) {
      try {
        const result = await check.check();
        if (result.orphaned > 0) {
          finalOrphaned += result.orphaned;
          console.log(`  🔴 ${check.name}: 여전히 ${result.orphaned}개 문제`);
        } else {
          console.log(`  ✅ ${check.name}: 정리 완료`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.name}: 재검증 실패`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    if (finalOrphaned === 0) {
      console.log('🎉 모든 데이터 무결성 문제 해결 완료!');
      console.log('✅ 데이터베이스가 FK 제약조건 준비 상태입니다.');
    } else {
      console.log(`⚠️ ${finalOrphaned}개 문제가 남아있습니다.`);
      console.log('📝 수동 정리가 필요합니다.');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error.message);
  }
}

async function cleanupOrphanedRecords(checkName, orphanedItems) {
  if (!orphanedItems || orphanedItems.length === 0) return;
  
  // 각 유형별 정리 로직
  if (checkName.includes('site_assignments orphaned user_ids')) {
    const ids = orphanedItems.map(item => item.id);
    const { error } = await supabase
      .from('site_assignments')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
  
  else if (checkName.includes('site_assignments orphaned site_ids')) {
    const ids = orphanedItems.map(item => item.id);
    const { error } = await supabase
      .from('site_assignments')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
  
  else if (checkName.includes('daily_reports orphaned site_ids')) {
    const ids = orphanedItems.map(item => item.id);
    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
  
  else if (checkName.includes('daily_reports orphaned created_by')) {
    const ids = orphanedItems.map(item => item.id);
    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
  
  else if (checkName.includes('documents orphaned owner_ids')) {
    const ids = orphanedItems.map(item => item.id);
    const { error } = await supabase
      .from('documents')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
  
  else if (checkName.includes('profiles orphaned')) {
    // profiles는 조심스럽게 처리 - 실제로는 auth.users를 먼저 생성해야 할 수도 있음
    console.log('  ⚠️ Profiles 정리는 수동으로 확인 후 진행하세요.');
  }
}

implementDataIntegrityChecks();