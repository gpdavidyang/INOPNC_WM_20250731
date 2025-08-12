const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function insertNPC1000RealisticData() {
  console.log('🚀 NPC-1000 관리 화면을 위한 실제 데이터 삽입 시작...\n');

  try {
    // 1. Manager 계정 및 현장 정보 확인
    const managerId = '950db250-82e4-4c9d-bf4d-75df7244764c';
    
    // 활성 현장 가져오기
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(1);

    if (sitesError) throw sitesError;
    
    if (!sites || sites.length === 0) {
      console.log('⚠️ 활성 현장이 없습니다. 현장을 먼저 생성합니다.');
      
      // 테스트용 현장 생성
      const { data: newSite, error: siteInsertError } = await supabase
        .from('sites')
        .insert({
          name: '서울 A현장',
          address: '서울특별시 강남구 테헤란로 123',
          status: 'active',
          contact_person: '김현장',
          contact_phone: '010-1234-5678'
        })
        .select()
        .single();
      
      if (siteInsertError) throw siteInsertError;
      sites.push(newSite);
    }
    
    const currentSite = sites[0];
    console.log('✅ 대상 현장:', currentSite.name, '(ID:', currentSite.id, ')');

    // 2. NPC-1000 자재 마스터 데이터 확인 및 생성
    const { data: existingMaterials, error: materialCheckError } = await supabase
      .from('npc1000_materials')
      .select('id, material_name')
      .limit(5);

    if (materialCheckError) throw materialCheckError;

    let materials = existingMaterials || [];
    
    if (materials.length === 0) {
      console.log('📦 NPC-1000 자재 마스터 데이터 생성 중...');
      
      const sampleMaterials = [
        {
          material_name: '콘크리트 (C24)',
          category: '구조재',
          npc_code: 'NPC-C24-001',
          unit: 'm³',
          unit_price: 120000,
          supplier: '대한레미콘',
          specification: '24MPa 구조용 콘크리트'
        },
        {
          material_name: '철근 (D16)',
          category: '구조재', 
          npc_code: 'NPC-D16-002',
          unit: 'ton',
          unit_price: 850000,
          supplier: '현대제철',
          specification: 'SD400 이형철근 직경16mm'
        },
        {
          material_name: '거푸집 합판',
          category: '가설재',
          npc_code: 'NPC-FM-003', 
          unit: '장',
          unit_price: 28000,
          supplier: '삼성건설자재',
          specification: '1800x900x12mm 구조용 합판'
        },
        {
          material_name: '모래 (세척사)',
          category: '골재',
          npc_code: 'NPC-SA-004',
          unit: 'm³', 
          unit_price: 45000,
          supplier: '한강골재',
          specification: '콘크리트용 세척사'
        },
        {
          material_name: '자갈 (쇄석)',
          category: '골재',
          npc_code: 'NPC-GR-005',
          unit: 'm³',
          unit_price: 35000,
          supplier: '한강골재', 
          specification: '25mm 쇄석골재'
        }
      ];

      const { data: insertedMaterials, error: insertError } = await supabase
        .from('npc1000_materials')
        .insert(sampleMaterials)
        .select();

      if (insertError) throw insertError;
      materials = insertedMaterials || [];
      console.log(`✅ ${materials.length}개 자재 마스터 데이터 생성 완료`);
    } else {
      console.log(`✅ 기존 자재 마스터 데이터 사용: ${materials.length}개`);
    }

    // 3. 작업일지 확인 및 생성 (NPC-1000 기록을 위해 필요)
    const { data: existingReports, error: reportCheckError } = await supabase
      .from('daily_reports')
      .select('id, work_date')
      .eq('site_id', currentSite.id)
      .gte('work_date', '2025-01-06')
      .lte('work_date', '2025-01-10')
      .order('work_date');

    if (reportCheckError) throw reportCheckError;

    let reports = existingReports || [];
    
    if (reports.length === 0) {
      console.log('📝 작업일지 생성 중...');
      
      const workDates = ['2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10'];
      const reportData = workDates.map(date => ({
        site_id: currentSite.id,
        work_date: date,
        member_name: '이현수',
        total_workers: 8,
        process_type: '콘크리트 타설',
        weather: '맑음',
        temperature_high: 15,
        temperature_low: 5,
        work_details: `${date} 콘크리트 타설 작업`,
        issues: '',
        status: 'submitted',
        created_by: managerId
      }));

      const { data: insertedReports, error: reportInsertError } = await supabase
        .from('daily_reports')
        .insert(reportData)
        .select();

      if (reportInsertError) throw reportInsertError;
      reports = insertedReports || [];
      console.log(`✅ ${reports.length}개 작업일지 생성 완료`);
    } else {
      console.log(`✅ 기존 작업일지 사용: ${reports.length}개`);
    }

    // 4. NPC-1000 일일 기록 데이터 생성
    console.log('📊 NPC-1000 일일 기록 데이터 생성 중...');
    
    const npcRecords = [];
    
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      
      // 각 작업일지마다 2-3개의 자재 사용 기록 생성
      const materialsToUse = materials.slice(0, Math.min(3, materials.length));
      
      for (let j = 0; j < materialsToUse.length; j++) {
        const material = materialsToUse[j];
        
        // 현실적인 자재 사용량 계산
        let incomingQty, usedQty, remainingQty;
        
        switch (material.category) {
          case '구조재':
            if (material.unit === 'm³') { // 콘크리트
              incomingQty = 50 + Math.floor(Math.random() * 30); // 50-80m³
              usedQty = Math.floor(incomingQty * 0.8); // 80% 사용
              remainingQty = incomingQty - usedQty;
            } else { // 철근 (ton)
              incomingQty = 5 + Math.floor(Math.random() * 3); // 5-8ton
              usedQty = Math.floor(incomingQty * 0.9); // 90% 사용
              remainingQty = incomingQty - usedQty;
            }
            break;
          case '가설재':
            incomingQty = 100 + Math.floor(Math.random() * 50); // 100-150장
            usedQty = Math.floor(incomingQty * 0.7); // 70% 사용 (재사용 가능)
            remainingQty = incomingQty - usedQty;
            break;
          case '골재':
            incomingQty = 20 + Math.floor(Math.random() * 20); // 20-40m³
            usedQty = Math.floor(incomingQty * 0.85); // 85% 사용
            remainingQty = incomingQty - usedQty;
            break;
          default:
            incomingQty = 10 + Math.floor(Math.random() * 20);
            usedQty = Math.floor(incomingQty * 0.8);
            remainingQty = incomingQty - usedQty;
        }

        const totalCost = usedQty * material.unit_price;

        npcRecords.push({
          daily_report_id: report.id,
          npc_material_id: material.id,
          incoming_quantity: incomingQty,
          used_quantity: usedQty,
          remaining_quantity: remainingQty,
          total_cost: totalCost,
          delivery_date: report.work_date,
          supplier: material.supplier,
          notes: `${report.work_date} ${material.material_name} 사용 기록`,
          created_by: managerId
        });
      }
    }

    // 기존 기록 확인 후 삽입
    const { data: existingNpcRecords, error: npcCheckError } = await supabase
      .from('npc1000_daily_records')
      .select('id')
      .in('daily_report_id', reports.map(r => r.id));

    if (npcCheckError) throw npcCheckError;

    if (!existingNpcRecords || existingNpcRecords.length === 0) {
      const { data: insertedNpcRecords, error: npcInsertError } = await supabase
        .from('npc1000_daily_records')
        .insert(npcRecords)
        .select();

      if (npcInsertError) throw npcInsertError;
      console.log(`✅ ${insertedNpcRecords?.length || 0}개 NPC-1000 일일 기록 생성 완료`);
    } else {
      console.log('✅ 기존 NPC-1000 일일 기록 사용');
    }

    // 5. 데이터 검증
    console.log('\n🔍 생성된 데이터 검증 중...');
    
    const { data: verifyRecords, error: verifyError } = await supabase
      .from('npc1000_daily_records')
      .select(`
        id,
        incoming_quantity,
        used_quantity,
        remaining_quantity,
        total_cost,
        delivery_date,
        npc1000_materials!inner(
          material_name,
          unit,
          category
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
      .order('delivery_date', { ascending: false })
      .limit(5);

    if (verifyError) throw verifyError;

    console.log('\n📊 최근 5개 NPC-1000 기록:');
    verifyRecords?.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.delivery_date} - ${record.npc1000_materials.material_name}`);
      console.log(`     입고: ${record.incoming_quantity}${record.npc1000_materials.unit}, ` +
                  `사용: ${record.used_quantity}${record.npc1000_materials.unit}, ` + 
                  `재고: ${record.remaining_quantity}${record.npc1000_materials.unit}`);
      console.log(`     금액: ${record.total_cost.toLocaleString()}원`);
    });

    // 6. 현황 요약 정보 생성 (npc1000_site_summary 뷰를 위한 데이터 확인)
    const { data: summaryData, error: summaryError } = await supabase
      .from('npc1000_site_summary')
      .select('*')
      .eq('site_id', currentSite.id)
      .limit(3);

    if (!summaryError && summaryData) {
      console.log('\n📈 현장 요약 정보:');
      summaryData.forEach((summary, index) => {
        console.log(`  ${index + 1}. ${summary.material_name}: 총 ${summary.total_used}${summary.unit} 사용`);
        console.log(`     총 금액: ${summary.total_cost.toLocaleString()}원, 기록 수: ${summary.report_count}건`);
      });
    }

    console.log('\n🎉 NPC-1000 관리 화면용 데이터 생성 완료!');
    console.log('💡 이제 manager@inopnc.com 계정으로 로그인하여 현장정보 > NPC-1000 관리 탭에서 데이터를 확인할 수 있습니다.');

  } catch (error) {
    console.error('❌ 데이터 삽입 중 오류 발생:', error);
  }
}

insertNPC1000RealisticData();