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

    // NPC-1000 자재 마스터 데이터 삽입
    const { error: materialsError } = await supabase
      .from('npc1000_materials')
      .upsert(npcMaterials, { onConflict: 'npc_code' });

    if (materialsError) throw materialsError;
    console.log(`✅ NPC-1000 자재 마스터 생성 완료: ${npcMaterials.length}개`);

    // 각 현장별로 자재 재고 및 일일 기록 생성
    for (const site of sites || []) {
      console.log(`\n📦 ${site.name} NPC-1000 데이터 생성...`);

      // 현장별 자재 재고 초기화
      const inventoryRecords = npcMaterials.map(material => ({
        site_id: site.id,
        npc_material_id: null, // 자재 ID는 삽입 후 획득
        npc_code: material.npc_code,
        material_name: material.material_name,
        current_stock: Math.floor(Math.random() * 100) + 10, // 10-110 단위
        reserved_stock: Math.floor(Math.random() * 20), // 0-20 단위 예약
        min_stock_level: Math.floor(Math.random() * 30) + 5, // 5-35 단위 최소재고
        max_stock_level: Math.floor(Math.random() * 200) + 100, // 100-300 단위 최대재고
        unit: material.unit,
        unit_price: material.standard_price,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));

      // 재고 데이터 삽입
      const { error: inventoryError } = await supabase
        .from('npc1000_inventory')
        .upsert(inventoryRecords, { onConflict: 'site_id,npc_code' });

      if (inventoryError) {
        console.error(`   ❌ ${site.name} 재고 데이터 오류: ${inventoryError.message}`);
        continue;
      }

      console.log(`   ✅ 재고 데이터 생성: ${inventoryRecords.length}개 자재`);

      // 일일 자재 기록 생성 (최근 2주간)
      const dailyRecords = [];
      const today = new Date();

      for (let day = 0; day < 14; day++) {
        const workDate = new Date(today);
        workDate.setDate(today.getDate() - day);
        const dateStr = workDate.toISOString().split('T')[0];

        // 주말 제외
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;

        // 하루에 3-5개 자재에 대한 입출고 기록
        const dailyMaterials = npcMaterials.slice(0, Math.floor(Math.random() * 3) + 3);

        dailyMaterials.forEach(material => {
          const incomingQty = Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : 0; // 30% 확률로 입고
          const usedQty = Math.floor(Math.random() * 30) + 5; // 5-35 단위 사용
          const remainingQty = Math.floor(Math.random() * 100) + 20; // 20-120 단위 잔량

          if (incomingQty > 0 || usedQty > 0) {
            dailyRecords.push({
              site_id: site.id,
              npc_code: material.npc_code,
              material_name: material.material_name,
              work_date: dateStr,
              incoming_quantity: incomingQty,
              used_quantity: usedQty,
              remaining_quantity: remainingQty,
              unit: material.unit,
              unit_price: material.unit_price,
              total_cost: (incomingQty * material.unit_price) + (usedQty * material.unit_price),
              supplier: material.supplier,
              delivery_date: incomingQty > 0 ? dateStr : null,
              notes: incomingQty > 0 ? '정상 입고' : '작업 사용',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        });
      }

      if (dailyRecords.length > 0) {
        const { error: dailyError } = await supabase
          .from('npc1000_daily_records')
          .insert(dailyRecords);

        if (dailyError) {
          console.error(`   ❌ ${site.name} 일일기록 오류: ${dailyError.message}`);
        } else {
          console.log(`   ✅ 일일기록 생성: ${dailyRecords.length}건`);
        }
      }
    }

    console.log('\n🎉 NPC-1000 자재 관리 데이터 생성 완료!');
    console.log('\n📊 생성된 데이터 요약:');
    console.log(`   - NPC-1000 자재 마스터: ${npcMaterials.length}개`);
    console.log(`   - 현장별 자재 재고: 각 현장당 ${npcMaterials.length}개`);
    console.log('   - 일일 자재 기록: 각 현장당 약 40-60건 (평일만)');
    console.log('\n💡 다음 기능들이 활성화됩니다:');
    console.log('   - 금일 현황 (입고/사용/재고)');
    console.log('   - 누적 현황 (총입고/총사용/현재고)');
    console.log('   - 자재별 입출고 내역 테이블');
    console.log('   - 재고 수준 모니터링');

  } catch (error) {
    console.error('❌ 전체 오류:', error.message);
    console.error('세부 오류:', error);
  }
}

insertNPC1000ManagementData();