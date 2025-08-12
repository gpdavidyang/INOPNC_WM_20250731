const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testManagerAccess() {
  console.log('🧪 Manager 계정으로 NPC-1000 데이터 접근 테스트\n');
  
  // Manager로 로그인
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  });
  
  if (authError) {
    console.error('❌ 로그인 실패:', authError.message);
    return;
  }
  
  console.log('✅ 로그인 성공:', authData.user?.email);
  
  // 현장 목록 확인
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name')
    .eq('status', 'active')
    .limit(3);
  
  console.log('\n🏗️ 접근 가능한 현장:');
  sites?.forEach((site, i) => {
    console.log(`  ${i+1}. ${site.name} (ID: ${site.id.substring(0,8)}...)`);
  });
  
  if (!sites || sites.length === 0) {
    console.log('⚠️ 접근 가능한 현장이 없습니다.');
    return;
  }
  
  const currentSite = sites[0];
  
  // NPC-1000 일일 기록 조회 (UI에서 실제 사용하는 쿼리와 동일)
  const { data: records, error: recordsError } = await supabase
    .from('npc1000_daily_records')
    .select(`
      id,
      incoming_quantity,
      used_quantity,
      remaining_quantity,
      total_cost,
      delivery_date,
      supplier,
      npc1000_materials!inner(
        material_name,
        category,
        npc_code,
        unit
      ),
      daily_reports!inner(
        work_date,
        site_id,
        sites!inner(
          name
        )
      )
    `)
    .eq('daily_reports.site_id', currentSite.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recordsError) {
    console.error('❌ NPC-1000 기록 조회 실패:', recordsError.message);
    return;
  }
  
  console.log(`\n📊 ${currentSite.name}의 NPC-1000 기록: ${records?.length || 0}건`);
  
  if (records && records.length > 0) {
    console.log('\n📋 최근 기록 (상위 3개):');
    records.slice(0, 3).forEach((record, i) => {
      console.log(`  ${i+1}. [${record.delivery_date}] ${record.npc1000_materials.material_name}`);
      console.log(`     입고: ${record.incoming_quantity}${record.npc1000_materials.unit}`);
      console.log(`     사용: ${record.used_quantity}${record.npc1000_materials.unit}`);
      console.log(`     재고: ${record.remaining_quantity}${record.npc1000_materials.unit}`);
      console.log(`     금액: ${record.total_cost.toLocaleString()}원`);
      console.log('');
    });
    
    // 금일 현황/누적 현황 계산 (UI와 동일한 로직)
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.delivery_date === today);
    
    const todayStatus = {
      incoming: todayRecords.reduce((sum, r) => sum + (r.incoming_quantity || 0), 0),
      used: todayRecords.reduce((sum, r) => sum + (r.used_quantity || 0), 0),
      remaining: todayRecords.reduce((sum, r) => sum + (r.remaining_quantity || 0), 0)
    };
    
    const cumulativeStatus = {
      totalIncoming: records.reduce((sum, r) => sum + (r.incoming_quantity || 0), 0),
      totalUsed: records.reduce((sum, r) => sum + (r.used_quantity || 0), 0),
      totalRemaining: records.reduce((sum, r) => sum + (r.remaining_quantity || 0), 0)
    };
    
    console.log('📅 금일 현황:');
    console.log(`   입고: ${todayStatus.incoming}, 사용: ${todayStatus.used}, 재고: ${todayStatus.remaining}`);
    
    console.log('\n📈 누적 현황:');
    console.log(`   총입고: ${cumulativeStatus.totalIncoming}, 총사용: ${cumulativeStatus.totalUsed}, 현재고: ${cumulativeStatus.totalRemaining}`);
  } else {
    console.log('⚠️ NPC-1000 기록이 없습니다.');
  }
  
  // 현장 요약 정보 조회
  const { data: summary, error: summaryError } = await supabase
    .from('npc1000_site_summary')
    .select('*')
    .eq('site_id', currentSite.id)
    .limit(3);
  
  if (!summaryError && summary && summary.length > 0) {
    console.log('\n📈 현장 요약 현황:');
    summary.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.material_name}: ${item.total_used}${item.unit} 사용`);
      console.log(`     총 금액: ${item.total_cost.toLocaleString()}원`);
    });
  }
  
  console.log('\n✨ 테스트 완료! NPC-1000 관리 탭에서 데이터를 확인할 수 있습니다.');
  console.log('🌐 URL: http://localhost:3000/dashboard/site-info > NPC-1000 관리 탭');
}

testManagerAccess();