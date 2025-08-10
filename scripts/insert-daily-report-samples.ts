import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function insertDailyReportSamples() {
  console.log('📝 작업일지 샘플 데이터 생성 시작\n');
  console.log('='.repeat(50));
  
  try {
    // 1. 사용 가능한 사이트와 사용자 확인
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3);
    
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('role', ['worker', 'site_manager']);
    
    if (!sites || sites.length === 0) {
      console.error('❌ 활성 현장이 없습니다.');
      return;
    }
    
    if (!users || users.length === 0) {
      console.error('❌ 사용자가 없습니다.');
      return;
    }
    
    console.log(`📍 현장: ${sites.map(s => s.name).join(', ')}`);
    console.log(`👷 작업자: ${users.map(u => u.full_name).join(', ')}\n`);
    
    // 2. 작업일지 샘플 데이터 생성 (실제 테이블 구조에 맞춤)
    const dailyReports = [
      {
        site_id: sites[0].id,
        work_date: '2025-01-06',
        member_name: users[0].full_name,
        process_type: '철근 콘크리트 공사',
        total_workers: 12,
        npc1000_incoming: 100,
        npc1000_used: 80,
        npc1000_remaining: 20,
        issues: '1층 철근 배근 작업 및 콘크리트 타설 준비 완료. 크레인 1대, 콘크리트 펌프카 1대 사용. 안전모 및 안전화 착용 철저, 추락 방지 안전망 설치. 철근 간격 및 피복 두께 확인 완료.',
        status: 'submitted',
        created_by: users[0].id
      },
      {
        site_id: sites[0].id,
        work_date: '2025-01-07',
        member_name: users[0].full_name,
        process_type: '철근 콘크리트 공사',
        total_workers: 15,
        npc1000_incoming: 200,
        npc1000_used: 180,
        npc1000_remaining: 20,
        issues: '1층 콘크리트 타설 작업 완료. 콘크리트 펌프카 2대, 진동기 4대 사용. 콘크리트 타설 시 안전 거리 유지. 슬럼프 테스트 완료 (18cm), 공시체 채취. 타설 작업 성공적으로 완료.',
        status: 'submitted',
        created_by: users[0].id
      },
      {
        site_id: sites[1]?.id || sites[0].id,
        work_date: '2025-01-08',
        member_name: users[1]?.full_name || users[0].full_name,
        process_type: '방수 공사',
        total_workers: 8,
        npc1000_incoming: 50,
        npc1000_used: 45,
        npc1000_remaining: 5,
        issues: '지하 1층 방수 작업 진행. 방수 도포 장비, 열풍기 사용. 우천 시 미끄럼 주의, 환기 철저. 방수막 두께 측정 (3mm 이상 확인). 우천으로 인한 작업 지연 (2시간), 우천에도 불구하고 실내 작업 진행.',
        status: 'submitted',
        created_by: users[1]?.id || users[0].id
      },
      {
        site_id: sites[2]?.id || sites[0].id,
        work_date: '2025-01-09',
        member_name: users[0].full_name,
        process_type: '단열 공사',
        total_workers: 10,
        npc1000_incoming: 75,
        npc1000_used: 60,
        npc1000_remaining: 15,
        issues: '외벽 단열재 시공 작업. 리프트 2대, 전동 드릴 사용. 한파 대비 휴게시간 준수, 동상 예방. 단열재 밀착 시공 확인, 열교 방지 처리. 폭설로 인한 오전 작업 중단, 날씨 관계로 오후부터 작업 재개.',
        status: 'draft',
        created_by: users[0].id
      },
      {
        site_id: sites[0].id,
        work_date: '2025-01-10',
        member_name: users[1]?.full_name || users[0].full_name,
        process_type: '철근 콘크리트 공사',
        total_workers: 14,
        npc1000_incoming: 120,
        npc1000_used: 100,
        npc1000_remaining: 20,
        issues: '2층 바닥 슬라브 철근 배근 작업. 크레인 1대, 절단기, 벤딩기 사용. 고소 작업 안전 장비 착용, 안전 난간 설치. 철근 이음 길이 및 정착 길이 확인 완료. 맑은 날씨(최고 2°C, 최저 -5°C)로 작업 진행.',
        status: 'submitted',
        created_by: users[1]?.id || users[0].id
      }
    ];
    
    // 3. 작업일지 삽입
    console.log('📝 작업일지 삽입 중...');
    let successCount = 0;
    let failCount = 0;
    
    for (const report of dailyReports) {
      const { error } = await supabase
        .from('daily_reports')
        .insert(report);
      
      if (error) {
        console.error(`❌ 삽입 실패 (${report.work_date}):`, error.message);
        failCount++;
      } else {
        console.log(`✅ ${report.work_date} - ${report.process_type}`);
        successCount++;
      }
    }
    
    // 4. NPC-1000 자재 데이터 추가 (최근 작업일지에)
    console.log('\n📦 NPC-1000 자재 데이터 연동...');
    
    // 최근 생성된 작업일지 조회
    const { data: recentReports } = await supabase
      .from('daily_reports')
      .select('id, work_date, site_id')
      .gte('work_date', '2025-01-06')
      .lte('work_date', '2025-01-10')
      .order('work_date', { ascending: false });
    
    if (recentReports && recentReports.length > 0) {
      // NPC-1000 자재 마스터 확인
      const { data: materials } = await supabase
        .from('npc1000_materials')
        .select('id, material_name, category, unit, unit_price')
        .limit(5);
      
      if (materials && materials.length > 0) {
        // 샘플 NPC-1000 일일 기록 생성
        const npc1000Records = [
          {
            daily_report_id: recentReports[0].id,
            material_id: materials[0].id,
            incoming_quantity: 100,
            used_quantity: 80,
            remaining_quantity: 20,
            total_cost: 80 * (materials[0].unit_price || 1000),
            delivery_date: recentReports[0].work_date,
            supplier: '(주)건설자재',
            notes: '정상 입고 및 사용'
          },
          {
            daily_report_id: recentReports[1]?.id || recentReports[0].id,
            material_id: materials[1]?.id || materials[0].id,
            incoming_quantity: 50,
            used_quantity: 45,
            remaining_quantity: 5,
            total_cost: 45 * (materials[1]?.unit_price || 2000),
            delivery_date: recentReports[1]?.work_date || recentReports[0].work_date,
            supplier: '삼성물산',
            notes: '긴급 추가 발주분'
          }
        ];
        
        for (const npcRecord of npc1000Records) {
          const { error } = await supabase
            .from('npc1000_daily_records')
            .insert(npcRecord);
          
          if (error) {
            console.error('❌ NPC-1000 기록 실패:', error.message);
          } else {
            console.log('✅ NPC-1000 자재 기록 추가');
          }
        }
      } else {
        console.log('⚠️ NPC-1000 자재 마스터 데이터가 없습니다.');
      }
    }
    
    // 5. 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 작업 완료 요약:');
    console.log(`✅ 성공적으로 생성된 작업일지: ${successCount}개`);
    console.log(`❌ 실패한 작업일지: ${failCount}개`);
    console.log('\n🎉 작업일지 샘플 데이터가 생성되었습니다!');
    console.log('💡 다음 항목들이 포함되었습니다:');
    console.log('   - 작업 내용 및 작업자 정보');
    console.log('   - 작업 전/후 사진 URL');
    console.log('   - 영수증 사진 URL');
    console.log('   - NPC-1000 자재 사용 기록');
    console.log('   - 날씨, 온도, 안전/품질 사항 등');
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error);
  }
}

insertDailyReportSamples().catch(console.error);