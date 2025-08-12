const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSitesData() {
  console.log('🏗️ 현장 데이터베이스 분석\n');
  
  try {
    // 관리자로 로그인
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'admin@inopnc.com',
      password: 'password123'
    });
    
    console.log('✅ 로그인 성공: admin@inopnc.com');
    
    // 모든 현장 정보 조회
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name, address, status, created_at')
      .order('name');
    
    if (error) {
      console.error('❌ 오류:', error.message);
      return;
    }
    
    console.log('📊 전체 현장 목록:');
    console.log('='.repeat(80));
    
    sites?.forEach((site, index) => {
      console.log(`${index + 1}. ${site.name}`);
      console.log(`   ID: ${site.id}`);
      console.log(`   주소: ${site.address || '주소 없음'}`);
      console.log(`   상태: ${site.status || 'N/A'}`);
      console.log(`   생성일: ${site.created_at?.split('T')[0] || 'N/A'}`);
      console.log('');
    });
    
    // Mock 데이터로 보이는 현장들 식별
    console.log('🔍 Mock 데이터 후보 식별:');
    console.log('='.repeat(50));
    
    const mockCandidates = sites?.filter(site => 
      site.name.includes('Site ') || 
      !site.address ||
      site.name.match(/^Site\s+\d+$/)
    );
    
    if (mockCandidates && mockCandidates.length > 0) {
      console.log('⚠️  Mock 데이터로 의심되는 현장들:');
      mockCandidates.forEach(site => {
        console.log(`   - ${site.name} (${site.id.substring(0, 8)}...)`);
        const reasons = [];
        if (!site.address) reasons.push('주소없음');
        if (site.name.match(/^Site\s+\d+$/)) reasons.push('일반적인이름');
        console.log(`     이유: ${reasons.join(', ')}`);
      });
    } else {
      console.log('✅ Mock 데이터로 의심되는 현장 없음');
    }
    
    // 실제 한국 현장들 식별
    console.log('\n🇰🇷 실제 현장으로 보이는 데이터:');
    console.log('='.repeat(50));
    
    const realSites = sites?.filter(site => 
      !site.name.includes('Site ') && 
      site.address &&
      !site.name.match(/^Site\s+\d+$/)
    );
    
    realSites?.forEach(site => {
      console.log(`   ✅ ${site.name}`);
      console.log(`      주소: ${site.address || '정보 없음'}`);
    });
    
    // 각 현장별 작업일지 수 확인
    console.log('\n📋 현장별 작업일지 수:');
    console.log('='.repeat(50));
    
    for (const site of sites || []) {
      const { count } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id);
      
      console.log(`   ${site.name}: ${count || 0}건`);
    }
    
    // Mock 데이터 삭제 권고사항
    console.log('\n💡 권고사항:');
    console.log('='.repeat(50));
    
    if (mockCandidates && mockCandidates.length > 0) {
      console.log('🗑️  삭제 권장 Mock 데이터:');
      for (const site of mockCandidates) {
        const { count } = await supabase
          .from('daily_reports')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id);
        
        if ((count || 0) === 0) {
          console.log(`   ❌ ${site.name} - 연결된 작업일지 없음, 즉시 삭제 가능`);
        } else {
          console.log(`   ⚠️  ${site.name} - ${count}건의 작업일지 연결됨, 신중히 삭제 필요`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 전체 오류:', error.message);
  }
}

checkSitesData();