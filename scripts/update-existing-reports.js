const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 상세한 작업 내용 템플릿
const DETAILED_WORK_CONTENTS = [
  `【작업 개요】
오늘은 1층 바닥 콘크리트 타설 작업을 성공적으로 완료했습니다.

【작업 상세】
• 작업 구역: A동 1층 전체 (약 250㎡)
• 콘크리트 규격: 25-240-12 (설계강도 24MPa)
• 투입 수량: 레미콘 30㎥
• 타설 방법: 펌프카 이용 (26m 붐)

【투입 인원】
• 현장소장: 1명
• 작업반장: 2명
• 콘크리트공: 6명
• 보조인력: 4명
• 안전관리자: 1명

【품질 관리】
• 슬럼프 테스트: 12±2cm (적합)
• 공기량 측정: 4.5% (기준: 4.5±1.5%)
• 시험체 제작: 3세트 (7일, 28일 강도 확인용)
• 표면 마감: 미장 마감 완료

【안전 조치】
• TBM 실시 (오전 7:30)
• 전 작업자 안전장구 착용 확인
• 펌프카 작업반경 통제
• 추락방지 안전난간 설치

【특이사항】
날씨가 다소 추워 보온 양생포 설치 완료. 콘크리트 타설 후 균열 방지를 위해 살수 양생 계획.`,

  `【작업 개요】
지하 1층 벽체 철근 배근 작업을 진행했습니다.

【작업 상세】
• 작업 위치: B1층 주차장 구역 (X1~X5, Y1~Y8)
• 철근 규격: HD13 (수직근), HD16 (수평근), HD22 (모서리 보강근)
• 배근 간격: @200 (수직), @250 (수평)
• 이음 방법: 겹침이음 40d

【투입 인원】
• 철근 작업반장: 2명
• 철근공: 12명
• 보조공: 5명
• 품질관리자: 1명

【검측 결과】
• 피복두께: 40mm (기준: 40mm 이상) ✓
• 배근간격: 도면 일치 ✓
• 정착길이: 적정 ✓
• 결속상태: 양호 ✓

【사용 자재】
• HD13: 5.2톤
• HD16: 3.8톤  
• HD22: 2.1톤
• 결속선: 65kg
• 스페이서: 1,200개

【내일 작업 계획】
구조감리 검측 예정 (오전 10시). 검측 통과 후 거푸집 설치 착수.`,

  `【작업 개요】
3~5층 외벽 단열재 시공 작업을 수행했습니다.

【작업 상세】
• 시공 면적: 320㎡ (동측, 서측 외벽)
• 단열재: 비드법보온판 2종 1호 100T
• 부착 방법: 접착제 + 화스너 병용
• 마감: 메쉬 부착 및 1차 미장

【투입 인원】
• 단열공: 8명
• 미장공: 4명
• 고소작업대 운전원: 2명

【시공 프로세스】
1. 바탕면 청소 및 프라이머 도포
2. 접착 몰탈 도포 (리본-점 부착법)
3. 단열재 부착 및 압착
4. 화스너 고정 (6개/㎡)
5. 메쉬 부착 및 미장

【품질 확인】
• 평활도: ±3mm 이내
• 접착강도 테스트: 0.15N/㎡ (기준: 0.1N/㎡ 이상)
• 단열재 이음부: 틈새 없음 확인

【안전 관리】
• 고소작업대 안전점검 완료
• 안전벨트 착용 및 2인 1조 작업
• 낙하물 방지망 설치`,

  `【작업 개요】
전기 설비 배관 및 배선 작업을 진행했습니다.

【작업 상세】
• 작업 층: 2층, 3층 사무실 구역
• 배관: CD관 16mm, 22mm, 28mm, 36mm
• 전선: IV 2.5SQ, 4SQ, 6SQ / HIV 10SQ, 16SQ
• 설치 수량: 스위치 박스 45개, 콘센트 박스 82개

【투입 인원】
• 전기 작업반장: 1명
• 전기공: 10명
• 보조공: 3명

【작업 내용】
1. 천장 배관 작업 (전등, 감지기용)
2. 벽체 배관 작업 (스위치, 콘센트용)
3. 전선 포설 작업
4. 박스 설치 및 고정
5. 절연저항 측정

【측정 결과】
• 절연저항: 200MΩ 이상 (기준: 1MΩ 이상)
• 접지저항: 10Ω (기준: 100Ω 이하)
• 도통시험: 전 구간 정상

【사용 자재】
• CD관: 총 450m
• IV전선: 총 1,200m
• 스위치/콘센트 박스: 127개
• 케이블 타이: 500개`,

  `【작업 개요】
옥상 우레탄 방수 작업을 실시했습니다.

【작업 상세】
• 시공 면적: 680㎡
• 방수 방법: 우레탄 도막방수 (3mm)
• 시공 순서: 바탕정리 → 프라이머 → 중도(2회) → 상도 → 보호층

【투입 인원】
• 방수 작업반장: 1명
• 방수공: 6명
• 보조공: 2명

【시공 프로세스】
1. 바탕면 그라인딩 및 청소
2. 크랙 보수 (폭 0.3mm 이상)
3. 프라이머 도포 (0.2kg/㎡)
4. 우레탄 중도 1차 (1.5kg/㎡)
5. 보강포 부착 (코너, 이음부)
6. 우레탄 중도 2차 (1.5kg/㎡)
7. 우레탄 상도 (0.3kg/㎡)

【기상 조건】
• 온도: 22℃
• 습도: 55%
• 날씨: 맑음
• 풍속: 2m/s

【품질 관리】
• 도막두께 측정: 평균 3.2mm
• 부착강도: 1.2N/㎡ (기준: 0.7N/㎡ 이상)
• 인장강도: 2.5N/㎡ (기준: 2.0N/㎡ 이상)

【특이사항】
48시간 양생 필요. 우천 대비 보양 시트 준비 완료.`
];

async function updateExistingReports() {
  try {
    console.log('🚀 기존 작업일지 상세 내용 업데이트 시작...\n');

    // 1. 모든 작업일지 조회
    const { data: reports, error: fetchError } = await supabase
      .from('daily_reports')
      .select('id, work_date, site_id')
      .order('work_date', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('작업일지 조회 실패:', fetchError);
      return;
    }

    console.log(`📋 작업일지 ${reports.length}개 발견\n`);

    let successCount = 0;
    let errorCount = 0;

    // 2. 각 작업일지에 상세 내용 업데이트
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const contentIndex = i % DETAILED_WORK_CONTENTS.length;
      const detailedContent = DETAILED_WORK_CONTENTS[contentIndex];
      
      // 날씨 데이터
      const weatherOptions = ['맑음', '구름조금', '흐림', '비', '눈'];
      const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
      
      // 작업 진행률
      const progressPercentage = 60 + Math.floor(Math.random() * 35); // 60-95%
      
      // 작업 인원
      const totalWorkers = 10 + Math.floor(Math.random() * 15); // 10-25명
      const totalWorkHours = totalWorkers * (7 + Math.random() * 2); // 7-9시간
      
      const updateData = {
        work_content: detailedContent,
        total_workers: totalWorkers,
        total_work_hours: Math.floor(totalWorkHours)
      };

      const { error: updateError } = await supabase
        .from('daily_reports')
        .update(updateData)
        .eq('id', report.id);

      if (updateError) {
        errorCount++;
        console.error(`❌ 업데이트 실패 (${report.work_date}):`, updateError.message);
      } else {
        successCount++;
        console.log(`✅ 업데이트 성공 ${successCount}/${reports.length}: ${report.work_date}`);
      }
    }

    // 3. 추가 현장 데이터 생성
    console.log('\n📍 현장 추가 정보 업데이트 중...\n');
    
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active');

    if (sites) {
      for (const site of sites) {
        // 현장 설명 업데이트
        const siteDescriptions = {
          '강남 A현장': '지하 2층, 지상 15층 규모의 오피스텔 신축 공사. 연면적 12,500㎡',
          '서초 B현장': '지하 3층, 지상 20층 규모의 주상복합 건물. 연면적 18,200㎡',
          'Site 1': '물류센터 신축 공사. 지상 4층, 연면적 8,800㎡'
        };

        const description = siteDescriptions[site.name] || '건설 현장';
        
        await supabase
          .from('sites')
          .update({
            description: description,
            max_workers: 50 + Math.floor(Math.random() * 100),
            safety_manager: '안전관리자',
            contact_number: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
          })
          .eq('id', site.id);
      }
    }

    console.log('\n✨ 작업일지 업데이트 완료!\n');
    console.log('📊 결과 요약:');
    console.log(`- 성공: ${successCount}개`);
    console.log(`- 실패: ${errorCount}개`);
    console.log(`- 전체: ${reports.length}개\n`);
    
    console.log('📝 업데이트된 내용:');
    console.log('• 상세한 작업 개요 및 프로세스');
    console.log('• 투입 인원 및 장비 정보');
    console.log('• 품질 관리 및 검측 결과');
    console.log('• 안전 조치 사항');
    console.log('• 사용 자재 목록');
    console.log('• 특이사항 및 내일 작업 계획\n');
    
    console.log('🎯 이제 Playwright 테스트에서 풍부한 콘텐츠를 확인할 수 있습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
updateExistingReports();