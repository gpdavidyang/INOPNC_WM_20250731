const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertNPC1000ManagementData() {
  console.log('📦 NPC-1000 자재 관리 데이터 생성 시작...\n');
  
  try {
    // 현장 정보 조회 (manager가 접근할 수 있는 현장들)
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(5);

    if (sitesError) throw sitesError;

    console.log('🏗️ 활성 현장 목록:');
    sites?.forEach(site => {
      console.log(`   - ${site.name} (${site.id.substring(0, 8)}...)`);
    });

    // NPC-1000 자재 마스터 데이터 생성 (실제 DB 스키마에 맞게 수정)
    const npcMaterials = [
      {
        npc_code: 'NPC-001-001',
        material_name: '레미콘 (25-24-150)',
        category: '콘크리트',
        unit: 'M3',
        standard_price: 95000,
        specification: '슬럼프 150mm, 압축강도 24MPa'
      },
      {
        npc_code: 'NPC-001-002', 
        material_name: '철근 SD400 (D16)',
        category: '철근',
        unit: 'TON',
        standard_price: 1200000,
        specification: '항복강도 400MPa, 직경 16mm'
      },
      {
        npc_code: 'NPC-001-003',
        material_name: '거푸집 합판 (18T)',
        category: '거푸집',
        unit: 'EA',
        standard_price: 35000,
        specification: '1800x900x18mm, 친환경 합판'
      },
      {
        npc_code: 'NPC-001-004',
        material_name: '방수시트 (2.0T)',
        category: '방수재',
        unit: 'M2',
        standard_price: 8500,
        specification: '두께 2.0mm, 폴리에틸렌계'
      },
      {
        npc_code: 'NPC-001-005',
        material_name: '단열재 EPS (100T)',
        category: '단열재',
        unit: 'M2',
        standard_price: 12000,
        specification: '압출법 폴리스티렌폼, 100mm'
      },
      {
        npc_code: 'NPC-001-006',
        material_name: '시멘트 (포틀랜드 1종)',
        category: '시멘트',
        unit: 'TON',
        standard_price: 95000,
        specification: '보통 포틀랜드 시멘트'
      },
      {
        npc_code: 'NPC-001-007',
        material_name: '골재 (25mm 쇄석)',
        category: '골재',
        unit: 'M3',
        standard_price: 28000,
        specification: '25mm 화강암 쇄석'
      },
      {
        npc_code: 'NPC-001-008',
        material_name: '모래 (세척사)',
        category: '골재',
        unit: 'M3',
        standard_price: 22000,
        specification: '세척 강모래'
      }
    ];

    // 1. NPC-1000 자재 마스터 데이터 삽입
    const { data: insertedMaterials, error: materialsError } = await supabase
      .from('npc1000_materials')
      .upsert(npcMaterials, { onConflict: 'npc_code' })
      .select();

    if (materialsError) throw materialsError;
    console.log(`✅ NPC-1000 자재 마스터 생성 완료: ${npcMaterials.length}개`);

    // manager@inopnc.com 사용자 ID 조회
    const { data: managerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'manager@inopnc.com')
      .single();

    if (profileError) throw profileError;
    console.log('✅ 매니저 프로필 확인 완료');

    // 각 현장별로 자재 일일 기록 생성
    for (const site of sites || []) {
      console.log(`\n📦 ${site.name} NPC-1000 데이터 생성...`);

      // 먼저 daily_reports 생성 (npc1000_daily_records의 foreign key 요구사항)
      const dailyReports = [];
      const today = new Date();

      for (let day = 0; day < 14; day++) {
        const workDate = new Date(today);
        workDate.setDate(today.getDate() - day);
        const dateStr = workDate.toISOString().split('T')[0];

        // 주말 제외
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;

        dailyReports.push({
          site_id: site.id,
          work_date: dateStr,
          member_name: '자재관리팀',
          process_type: 'NPC-1000 자재 관리',
          total_workers: 2,
          status: 'submitted',
          created_by: managerProfile.id,
          issues: null
        });
      }

      // daily_reports 삽입
      const { data: insertedReports, error: reportsError } = await supabase
        .from('daily_reports')
        .upsert(dailyReports, { onConflict: 'site_id,work_date,created_by' })
        .select();

      if (reportsError) {
        console.error(`   ❌ ${site.name} 작업일지 오류: ${reportsError.message}`);
        continue;
      }

      console.log(`   ✅ 작업일지 생성: ${insertedReports?.length || 0}건`);

      // NPC-1000 일일 자재 기록 생성
      const npcDailyRecords = [];

      // 각 작업일지에 대해 자재 기록 생성
      for (const report of insertedReports || []) {
        // 하루에 3-5개 자재에 대한 입출고 기록
        const dailyMaterialCount = Math.floor(Math.random() * 3) + 3;
        const selectedMaterials = insertedMaterials?.slice(0, dailyMaterialCount) || [];

        selectedMaterials.forEach(material => {
          const incomingQty = Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : 0;
          const usedQty = Math.floor(Math.random() * 30) + 5;
          const remainingQty = Math.floor(Math.random() * 100) + 20;

          if (incomingQty > 0 || usedQty > 0) {
            npcDailyRecords.push({
              daily_report_id: report.id,
              npc_material_id: material.id,
              incoming_quantity: incomingQty,
              used_quantity: usedQty,
              remaining_quantity: remainingQty,
              unit_price: material.standard_price,
              delivery_date: incomingQty > 0 ? report.work_date : null,
              supplier: incomingQty > 0 ? '한국건설자재공급(주)' : null,
              notes: incomingQty > 0 ? '정상 입고' : '작업 사용'
            });
          }
        });
      }

      // NPC-1000 일일 기록 삽입
      if (npcDailyRecords.length > 0) {
        const { error: npcDailyError } = await supabase
          .from('npc1000_daily_records')
          .insert(npcDailyRecords);

        if (npcDailyError) {
          console.error(`   ❌ ${site.name} NPC 일일기록 오류: ${npcDailyError.message}`);
        } else {
          console.log(`   ✅ NPC-1000 일일기록 생성: ${npcDailyRecords.length}건`);
        }
      }
    }

    console.log('\n🎉 NPC-1000 자재 관리 데이터 생성 완료!');
    console.log('\n📊 생성된 데이터 요약:');
    console.log(`   - NPC-1000 자재 마스터: ${npcMaterials.length}개`);
    console.log('   - 각 현장별 작업일지: 약 10건 (평일만)');
    console.log('   - NPC-1000 일일 자재 기록: 각 현장당 약 30-50건');
    console.log('\n💡 다음 기능들이 활성화됩니다:');
    console.log('   - 금일 현황 (입고/사용/재고)');
    console.log('   - 누적 현황 (총입고/총사용/현재고)');
    console.log('   - 자재별 입출고 내역 테이블');

  } catch (error) {
    console.error('❌ 전체 오류:', error.message);
    console.error('세부 오류:', error);
  }
}

insertNPC1000ManagementData();