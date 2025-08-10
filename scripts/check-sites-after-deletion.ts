import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSitesAfterDeletion() {
  console.log('🏗️ 삭제 후 현장 현황\n');
  console.log('='.repeat(50));
  
  // 관리자로 로그인
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'admin@inopnc.com',
    password: 'password123'
  });
  
  // 현장 목록 조회
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, name, address, status')
    .order('name');
  
  if (error) {
    console.error('❌ 오류:', error.message);
    return;
  }
  
  console.log(`📊 현재 등록된 현장 수: ${sites?.length || 0}개\n`);
  
  // 현장명별 그룹핑
  const siteGroups: Record<string, any[]> = {};
  sites?.forEach(site => {
    if (!siteGroups[site.name]) {
      siteGroups[site.name] = [];
    }
    siteGroups[site.name].push(site);
  });
  
  console.log('📋 현장 목록 (그룹별):');
  console.log('-'.repeat(52));
  
  Object.entries(siteGroups).forEach(([name, sitesInGroup]) => {
    console.log(`\n📍 ${name} (${sitesInGroup.length}개)`);
    sitesInGroup.forEach((site, index) => {
      const prefix = sitesInGroup.length > 1 ? `   ${index + 1}. ` : '   ';
      console.log(`${prefix}ID: ${site.id.substring(0, 8)}...`);
      console.log(`${prefix.replace(/./g, ' ')}주소: ${site.address || '주소 없음'}`);
      console.log(`${prefix.replace(/./g, ' ')}상태: ${site.status || 'N/A'}`);
    });
  });
  
  // 중복 현장 체크
  const duplicates = Object.entries(siteGroups).filter(([name, sites]) => sites.length > 1);
  
  console.log('\n📊 중복 현장 현황:');
  console.log('-'.repeat(52));
  if (duplicates.length > 0) {
    console.log('⚠️  여전히 중복된 현장:');
    duplicates.forEach(([name, sites]) => {
      console.log(`   - ${name}: ${sites.length}개`);
    });
  } else {
    console.log('✅ 중복 현장 없음 - 정리 완료!');
  }
  
  console.log('\n🎯 정리 전후 비교:');
  console.log(`   정리 전: 21개 현장 (중복 포함)`);
  console.log(`   정리 후: ${sites?.length || 0}개 현장`);
  console.log(`   삭제된 중복: 4개`);
}

checkSitesAfterDeletion().catch(console.error);