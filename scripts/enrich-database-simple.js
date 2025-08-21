const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 작업 내용 상세 템플릿
const WORK_DETAILS = [
  {
    title: '1층 콘크리트 타설 작업',
    description: `오늘 1층 바닥 콘크리트 타설 작업을 완료했습니다.
    - 타설 면적: 250㎡
    - 콘크리트 강도: 24MPa
    - 투입 인원: 작업자 8명, 관리자 2명
    - 사용 장비: 펌프카 1대, 진동기 4대
    - 작업 시간: 08:00 ~ 17:00
    - 품질 확인: 슬럼프 테스트 완료 (12cm)`,
    special_notes: '날씨가 추워 양생에 특별히 주의가 필요함. 보온 덮개 설치 완료. 내일 오전 양생 상태 재점검 예정.'
  },
  {
    title: '지하 1층 철근 배근 작업',
    description: `지하 1층 벽체 철근 배근 작업 진행중입니다.
    - 작업 구간: B1 주차장 구역 A~C
    - 철근 규격: HD13, HD16, HD22
    - 진행률: 전체 75% 완료
    - 투입 인원: 철근공 12명, 보조 4명
    - 검측 결과: 피복 두께 및 간격 적정
    - 품질 확인: 구조감리 검측 통과`,
    special_notes: '구조 변경으로 인한 추가 철근 필요. 내일 오전 입고 예정. 우천시 녹 방지 조치 완료.'
  },
  {
    title: '외벽 단열재 시공',
    description: `동측 외벽 단열재 시공 작업을 진행했습니다.
    - 시공 면적: 180㎡
    - 단열재 종류: 비드법 2종 1호 100T
    - 작업 구간: 2층 ~ 4층 동측면
    - 투입 인원: 작업자 6명
    - 완료율: 60%
    - 접착 강도 테스트: 합격`,
    special_notes: '강풍 예보로 인해 오후 작업 중단. 내일 재개 예정. 자재 보관 창고에 임시 보관 완료.'
  },
  {
    title: '전기 배관 및 배선 작업',
    description: `3층 사무실 구역 전기 배관 및 배선 작업을 수행했습니다.
    - 작업 구역: 3층 301호 ~ 308호
    - 배관: PVC 16mm, 22mm, 28mm
    - 배선: IV 2.5sq, 4sq, 6sq
    - 투입 인원: 전기공 8명
    - 진행 상황: 배관 100%, 배선 70% 완료
    - 절연 저항 측정: 100MΩ 이상 (합격)`,
    special_notes: '스위치 및 콘센트 위치 변경 요청 반영 완료. 전기 감리 중간 검사 예정.'
  },
  {
    title: '옥상 방수 작업',
    description: `옥상층 우레탄 방수 작업을 실시했습니다.
    - 작업 면적: 450㎡
    - 방수 종류: 우레탄 도막 방수 3mm
    - 작업 순서: 바탕 처리 → 프라이머 → 중도 → 상도
    - 투입 인원: 방수공 5명
    - 날씨: 맑음, 온도 18°C, 습도 45%
    - 도막 두께 측정: 평균 3.2mm`,
    special_notes: '우천 대비 양생 시트 준비. 48시간 양생 필요. 방수 보증서 발급 예정.'
  },
  {
    title: '타워크레인 설치 작업',
    description: `타워크레인 설치 및 시운전을 완료했습니다.
    - 크레인 모델: STT-293 (12톤)
    - 설치 높이: 45m
    - 작업 반경: 60m
    - 투입 인원: 전문 설치팀 8명
    - 안전 검사: 한국산업안전공단 검사 합격
    - 시운전: 정상 작동 확인`,
    special_notes: '주변 건물 안전 조치 완료. 야간 경광등 설치. 운전원 교육 실시 완료.'
  },
  {
    title: '지하 굴착 작업',
    description: `지하 2층 굴착 작업을 진행했습니다.
    - 굴착 깊이: GL -8.5m
    - 굴착 면적: 1,200㎡
    - 굴착량: 약 850㎥
    - 투입 장비: 굴삭기 3대, 덤프트럭 8대
    - 흙막이 상태: 변위 측정 결과 안정
    - 지하수위: GL -12m (양호)`,
    special_notes: '인근 건물 균열 모니터링 중. 진동 및 소음 측정 기준치 이내. 토사 반출 완료.'
  },
  {
    title: '커튼월 설치 작업',
    description: `남측 커튼월 유닛 설치 작업을 수행했습니다.
    - 설치 구간: 5층 ~ 8층 남측면
    - 유닛 수량: 24개 (유닛당 3m x 4m)
    - 투입 인원: 커튼월 전문팀 10명
    - 진행률: 40% 완료
    - 수직/수평 정밀도: ±3mm 이내
    - 기밀성 테스트: 예정`,
    special_notes: '고소작업 안전 조치 완료. 강풍시 작업 중단 기준 설정. 유리 파손 방지 보호필름 부착.'
  }
];

// 랜덤 선택 함수
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function enrichDatabaseContent() {
  try {
    console.log('🚀 데이터베이스 콘텐츠 보강 시작...\n');

    // 1. 기존 daily_reports 조회
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .order('work_date', { ascending: false })
      .limit(30);

    if (reportsError) {
      console.error('작업일지 조회 실패:', reportsError);
      return;
    }

    console.log(`📋 기존 작업일지 ${reports.length}개 발견\n`);

    // 2. 각 작업일지에 상세 내용 추가
    let successCount = 0;
    for (const report of reports) {
      const workDetail = getRandomItem(WORK_DETAILS);
      
      // 작업일지 업데이트 (존재하는 필드만)
      const updateData = {
        work_content: workDetail.description,
        special_notes: workDetail.special_notes
      };

      const { error: updateError } = await supabase
        .from('daily_reports')
        .update(updateData)
        .eq('id', report.id);

      if (updateError) {
        console.error(`작업일지 ${report.id} 업데이트 실패:`, updateError.message);
      } else {
        successCount++;
        console.log(`✅ 작업일지 업데이트 (${successCount}/${reports.length}): ${workDetail.title}`);
      }
    }

    // 3. 문서 데이터 추가 (도면, PTW, 영수증 등)
    console.log('\n📁 문서 데이터 추가 중...\n');

    // 샘플 현장 ID 조회
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(3);

    if (sites && sites.length > 0) {
      let docCount = 0;
      
      for (const site of sites) {
        // 도면 문서 추가
        for (let i = 0; i < 3; i++) {
          const blueprintData = {
            title: `${site.name} ${i + 1}층 도면`,
            file_type: 'document',
            file_url: `https://example.com/blueprints/${site.id}_floor_${i + 1}.pdf`,
            file_size: Math.floor(Math.random() * 5000000) + 1000000,
            mime_type: 'application/pdf',
            category: '도면',
            site_id: site.id,
            is_public: true,
            description: `${site.name} ${i + 1}층 건축 도면입니다. 구조, 전기, 설비 통합 도면.`,
            tags: ['도면', '건축', `${i + 1}층`]
          };

          const { error: docError } = await supabase
            .from('documents')
            .insert(blueprintData);

          if (!docError) {
            docCount++;
            console.log(`✅ 도면 추가 (${docCount}): ${site.name} ${i + 1}층`);
          }
        }

        // PTW 문서 추가
        for (let i = 0; i < 2; i++) {
          const ptwNumber = `PTW-2025-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
          const ptwData = {
            title: `작업허가서 ${ptwNumber}`,
            file_type: 'document',
            file_url: `https://example.com/ptw/${ptwNumber}.pdf`,
            file_size: Math.floor(Math.random() * 1000000) + 500000,
            mime_type: 'application/pdf',
            category: 'PTW',
            site_id: site.id,
            is_public: false,
            description: '고위험 작업 허가서 - 크레인 작업, 용접 작업, 고소작업 포함',
            tags: ['PTW', '안전', '작업허가서']
          };

          const { error: docError } = await supabase
            .from('documents')
            .insert(ptwData);

          if (!docError) {
            docCount++;
            console.log(`✅ PTW 추가 (${docCount}): ${ptwNumber}`);
          }
        }

        // 작업 사진 문서 추가
        for (let i = 0; i < 5; i++) {
          const photoTypes = ['작업전', '작업중', '작업후', '안전점검', '품질확인'];
          const photoType = photoTypes[i];
          
          const photoData = {
            title: `${site.name} ${photoType} 사진`,
            file_type: 'image',
            file_url: `https://example.com/photos/${site.id}_${photoType}_${Date.now()}.jpg`,
            file_size: Math.floor(Math.random() * 3000000) + 500000,
            mime_type: 'image/jpeg',
            category: '현장사진',
            site_id: site.id,
            is_public: true,
            description: `${new Date().toLocaleDateString('ko-KR')} ${photoType} 현장 사진`,
            tags: ['사진', photoType, '현장기록']
          };

          const { error: docError } = await supabase
            .from('documents')
            .insert(photoData);

          if (!docError) {
            docCount++;
            console.log(`✅ 사진 추가 (${docCount}): ${photoType}`);
          }
        }

        // 영수증 문서 추가
        for (let i = 0; i < 4; i++) {
          const receiptTypes = [
            { type: '자재구매', vendor: '(주)건설자재' },
            { type: '장비임대', vendor: '대한중장비' },
            { type: '유류비', vendor: 'SK에너지' },
            { type: '식대', vendor: '현장식당' }
          ];
          const receipt = receiptTypes[i];
          
          const receiptData = {
            title: `${receipt.type} 영수증 - ${new Date().toLocaleDateString('ko-KR')}`,
            file_type: 'document',
            file_url: `https://example.com/receipts/receipt_${Date.now()}_${i}.pdf`,
            file_size: Math.floor(Math.random() * 500000) + 100000,
            mime_type: 'application/pdf',
            category: '영수증',
            site_id: site.id,
            is_public: false,
            description: `${receipt.type} 관련 영수증 - ${receipt.vendor}`,
            tags: ['영수증', receipt.type, '경비'],
            metadata: {
              amount: Math.floor(Math.random() * 5000000) + 100000,
              vendor: receipt.vendor,
              receipt_date: new Date().toISOString().split('T')[0],
              payment_method: ['현금', '카드', '계좌이체'][Math.floor(Math.random() * 3)]
            }
          };

          const { error: docError } = await supabase
            .from('documents')
            .insert(receiptData);

          if (!docError) {
            docCount++;
            console.log(`✅ 영수증 추가 (${docCount}): ${receipt.type}`);
          }
        }
      }
      
      console.log(`\n📄 총 ${docCount}개의 문서가 추가되었습니다.`);
    }

    // 4. 알림 데이터 추가
    console.log('\n🔔 알림 데이터 추가 중...\n');
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(5);

    if (profiles && profiles.length > 0) {
      const notifications = [
        { title: '작업일지 승인 요청', message: '오늘자 작업일지를 검토해 주세요.', type: 'info' },
        { title: 'PTW 갱신 필요', message: 'PTW-2025-001 문서가 내일 만료됩니다.', type: 'warning' },
        { title: '안전 점검 완료', message: '월간 안전 점검이 완료되었습니다.', type: 'success' },
        { title: '자재 입고 예정', message: '내일 오전 9시 철근 10톤이 입고 예정입니다.', type: 'info' },
        { title: '날씨 주의보', message: '내일 강풍 주의보가 발령되었습니다. 고소작업 주의 바랍니다.', type: 'warning' }
      ];

      let notifCount = 0;
      for (const profile of profiles) {
        for (let i = 0; i < 2; i++) {
          const notif = getRandomItem(notifications);
          const { error } = await supabase
            .from('notifications')
            .insert({
              user_id: profile.id,
              title: notif.title,
              message: notif.message,
              type: notif.type,
              is_read: Math.random() > 0.5
            });

          if (!error) {
            notifCount++;
            console.log(`✅ 알림 추가 (${notifCount}): ${profile.full_name} - ${notif.title}`);
          }
        }
      }
    }

    console.log('\n✨ 데이터베이스 콘텐츠 보강 완료!\n');
    console.log('📊 최종 요약:');
    console.log(`- 작업일지 상세 내용 추가: ${successCount}개`);
    console.log(`- 문서 추가: ${sites ? sites.length * 14 : 0}개 (도면, PTW, 사진, 영수증)`);
    console.log(`- 알림 추가: ${profiles ? profiles.length * 2 : 0}개`);
    console.log('\n🎯 Playwright 테스트를 위한 풍부한 데이터가 준비되었습니다!');
    console.log('📌 추가된 데이터 카테고리:');
    console.log('  • 상세한 작업 내용 설명');
    console.log('  • 특이사항 및 안전 관련 메모');
    console.log('  • 도면 파일 (층별)');
    console.log('  • PTW 작업허가서');
    console.log('  • 현장 사진 (작업전/중/후)');
    console.log('  • 경비 영수증');
    console.log('  • 사용자 알림');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
enrichDatabaseContent();