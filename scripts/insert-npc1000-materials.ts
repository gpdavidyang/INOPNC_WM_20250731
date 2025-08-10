import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function insertNPC1000Materials() {
  console.log('📦 NPC-1000 자재 마스터 데이터 생성 시작\n');
  console.log('='.repeat(50));
  
  try {
    // 인증 (필요한 경우)
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'admin@inopnc.com',
      password: 'password123'
    });

    // 1. NPC-1000 자재 마스터 데이터 생성
    const materials = [
      {
        material_name: '철근 D19',
        category: '철근',
        npc_code: 'NPC-1001',
        unit: 'TON',
        standard_price: 850000,
        specification: '콘크리트용 철근 D19 (19mm 직경)',
        is_active: true
      },
      {
        material_name: '레미콘 24-210-12',
        category: '콘크리트',
        npc_code: 'NPC-1002', 
        unit: 'M3',
        standard_price: 120000,
        specification: '24MPa, 슬럼프 210mm, 최대 골재 12mm',
        is_active: true
      },
      {
        material_name: '방수시트 2mm',
        category: '방수재',
        npc_code: 'NPC-1003',
        unit: 'M2',
        standard_price: 15000,
        specification: 'HDPE 방수시트 2mm 두께',
        is_active: true
      },
      {
        material_name: '단열재 EPS 50mm',
        category: '단열재',
        npc_code: 'NPC-1004',
        unit: 'M2',
        standard_price: 8000,
        specification: '압출법 스티로폼 50mm 두께',
        is_active: true
      },
      {
        material_name: '철근 D13',
        category: '철근',
        npc_code: 'NPC-1005',
        unit: 'TON',
        standard_price: 820000,
        specification: '콘크리트용 철근 D13 (13mm 직경)',
        is_active: true
      }
    ];
    
    console.log('📋 NPC-1000 자재 삽입 중...');
    let successCount = 0;
    let failCount = 0;
    let existingCount = 0;
    
    for (const material of materials) {
      const { error } = await supabase
        .from('npc1000_materials')
        .insert(material);
      
      if (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`⚪ 이미 존재 (${material.material_name}) - ${material.npc_code}`);
          existingCount++;
        } else {
          console.error(`❌ 삽입 실패 (${material.material_name}):`, error.message);
          failCount++;
        }
      } else {
        console.log(`✅ ${material.material_name} - ${material.npc_code}`);
        successCount++;
      }
    }
    
    // 2. 생성된 자재들과 작업일지 연동
    console.log('\n📝 작업일지와 NPC-1000 자재 연동...');
    
    // 최근 작업일지 조회
    const { data: recentReports } = await supabase
      .from('daily_reports')
      .select('id, work_date, site_id, npc1000_incoming, npc1000_used, npc1000_remaining')
      .gte('work_date', '2025-01-06')
      .lte('work_date', '2025-01-10')
      .order('work_date', { ascending: true });
    
    // 생성된 자재 조회
    const { data: createdMaterials } = await supabase
      .from('npc1000_materials')
      .select('id, material_name, category, standard_price, unit')
      .eq('is_active', true)
      .limit(5);
    
    if (recentReports && createdMaterials && recentReports.length > 0 && createdMaterials.length > 0) {
      console.log(`📊 ${recentReports.length}개 작업일지와 ${createdMaterials.length}개 자재 연동`);
      
      // 각 작업일지에 대해 NPC-1000 일일 기록 생성
      const npc1000Records = [];
      
      recentReports.forEach((report, reportIndex) => {
        // 각 작업일지마다 1-2개의 자재 기록 생성
        const materialCount = reportIndex % 2 === 0 ? 2 : 1;
        
        for (let i = 0; i < materialCount && i < createdMaterials.length; i++) {
          const material = createdMaterials[i];
          const baseQuantity = report.npc1000_used || 50;
          
          npc1000Records.push({
            daily_report_id: report.id,
            npc_material_id: material.id,
            incoming_quantity: report.npc1000_incoming || baseQuantity + 20,
            used_quantity: baseQuantity,
            remaining_quantity: report.npc1000_remaining || 20,
            unit_price: material.standard_price,
            delivery_date: report.work_date,
            supplier: i % 2 === 0 ? '(주)건설자재' : '삼성물산',
            notes: `${material.material_name} 정상 입고 및 사용 완료`,
            created_by: authData.user?.id
          });
        }
      });
      
      // NPC-1000 일일 기록 삽입
      let npcSuccessCount = 0;
      let npcFailCount = 0;
      
      for (const npcRecord of npc1000Records) {
        const { error } = await supabase
          .from('npc1000_daily_records')
          .insert(npcRecord);
        
        if (error) {
          console.error('❌ NPC-1000 기록 실패:', error.message);
          npcFailCount++;
        } else {
          console.log(`✅ NPC-1000 기록 추가 (${npcRecord.delivery_date})`);
          npcSuccessCount++;
        }
      }
      
      console.log(`\n📦 NPC-1000 기록 완료: 성공 ${npcSuccessCount}개, 실패 ${npcFailCount}개`);
    } else {
      console.log('⚠️ 작업일지 또는 자재 데이터가 부족합니다.');
    }
    
    // 3. 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 NPC-1000 데이터 생성 완료:');
    console.log(`✅ 자재 마스터 신규 생성: ${successCount}개`);
    console.log(`⚪ 기존 자재: ${existingCount}개`);
    console.log(`❌ 자재 실패: ${failCount}개`);
    console.log('\n🎉 NPC-1000 자재 시스템이 준비되었습니다!');
    console.log('💡 이제 작업일지에서 실제 자재 사용 내역을 확인할 수 있습니다.');
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error);
  }
}

insertNPC1000Materials().catch(console.error);