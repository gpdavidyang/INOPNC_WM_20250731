const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 샘플 파일 URL들 (실제 프로덕션에서는 실제 파일 업로드 필요)
const SAMPLE_FILES = {
  blueprints: [
    'https://example.com/blueprints/kangnam-a-site-1f.pdf',
    'https://example.com/blueprints/kangnam-a-site-2f.pdf',
    'https://example.com/blueprints/kangnam-a-site-3f.pdf',
    'https://example.com/blueprints/kangnam-a-site-basement.pdf'
  ],
  ptw: [
    'https://example.com/ptw/PTW-2025-001.pdf',
    'https://example.com/ptw/PTW-2025-002.pdf',
    'https://example.com/ptw/PTW-2025-003.pdf'
  ],
  photos: [
    'https://example.com/photos/site-progress-001.jpg',
    'https://example.com/photos/site-progress-002.jpg',
    'https://example.com/photos/concrete-work-001.jpg',
    'https://example.com/photos/steel-frame-001.jpg',
    'https://example.com/photos/electrical-work-001.jpg'
  ],
  receipts: [
    'https://example.com/receipts/material-purchase-001.pdf',
    'https://example.com/receipts/equipment-rental-001.pdf',
    'https://example.com/receipts/fuel-receipt-001.pdf'
  ]
};

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
    special_notes: '날씨가 추워 양생에 특별히 주의가 필요함. 보온 덮개 설치 완료.',
    safety_notes: 'TBM 실시 완료. 안전모, 안전화 착용 확인. 추락 방지 안전난간 설치 확인.',
    materials: ['레미콘 25㎥', '철근 D13 2톤', '와이어메쉬 200㎡'],
    equipment: ['펌프카 26m 1대', '진동기 4대', '레벨기 2대']
  },
  {
    title: '지하 1층 철근 배근 작업',
    description: `지하 1층 벽체 철근 배근 작업 진행중입니다.
    - 작업 구간: B1 주차장 구역 A~C
    - 철근 규격: HD13, HD16, HD22
    - 진행률: 전체 75% 완료
    - 투입 인원: 철근공 12명, 보조 4명
    - 검측 결과: 피복 두께 및 간격 적정`,
    special_notes: '구조 변경으로 인한 추가 철근 필요. 내일 오전 입고 예정.',
    safety_notes: '철근 운반시 2인 1조 작업. 용접 작업시 소화기 비치.',
    materials: ['HD13 철근 5톤', 'HD16 철근 3톤', 'HD22 철근 2톤', '결속선 50kg'],
    equipment: ['크레인 25톤 1대', '절곡기 2대', '컷팅기 3대']
  },
  {
    title: '외벽 단열재 시공',
    description: `동측 외벽 단열재 시공 작업을 진행했습니다.
    - 시공 면적: 180㎡
    - 단열재 종류: 비드법 2종 1호 100T
    - 작업 구간: 2층 ~ 4층 동측면
    - 투입 인원: 작업자 6명
    - 완료율: 60%`,
    special_notes: '강풍 예보로 인해 오후 작업 중단. 내일 재개 예정.',
    safety_notes: '고소작업 안전벨트 착용 확인. 낙하물 방지망 설치.',
    materials: ['단열재 100T 200장', '접착 몰탈 20포', '메쉬 200㎡'],
    equipment: ['고소작업대 2대', '컷팅기 4대']
  },
  {
    title: '전기 배관 및 배선 작업',
    description: `3층 사무실 구역 전기 배관 및 배선 작업을 수행했습니다.
    - 작업 구역: 3층 301호 ~ 308호
    - 배관: PVC 16mm, 22mm, 28mm
    - 배선: IV 2.5sq, 4sq, 6sq
    - 투입 인원: 전기공 8명
    - 진행 상황: 배관 100%, 배선 70% 완료`,
    special_notes: '스위치 및 콘센트 위치 변경 요청 반영 완료.',
    safety_notes: '활선 작업 금지. 절연 장갑 착용. 누전 차단기 설치 확인.',
    materials: ['PVC 배관 200m', 'IV 전선 500m', '스위치 박스 50개', '콘센트 박스 80개'],
    equipment: ['파이프 벤더 3대', '통선기 2세트', '메가테스터 1대']
  },
  {
    title: '옥상 방수 작업',
    description: `옥상층 우레탄 방수 작업을 실시했습니다.
    - 작업 면적: 450㎡
    - 방수 종류: 우레탄 도막 방수 3mm
    - 작업 순서: 바탕 처리 → 프라이머 → 중도 → 상도
    - 투입 인원: 방수공 5명
    - 날씨: 맑음, 온도 18°C, 습도 45%`,
    special_notes: '우천 대비 양생 시트 준비. 48시간 양생 필요.',
    safety_notes: '유기용제 사용으로 환기 철저. 방독 마스크 착용.',
    materials: ['우레탄 방수재 30kg × 15통', '프라이머 20L × 5통', '신나 20L × 3통'],
    equipment: ['에어리스 도장기 2대', '롤러 세트 10개', '송풍기 2대']
  }
];

// 랜덤 선택 함수
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
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
    for (const report of reports) {
      const workDetail = getRandomItem(WORK_DETAILS);
      
      // 작업일지 업데이트
      const { error: updateError } = await supabase
        .from('daily_reports')
        .update({
          work_content: workDetail.description,
          special_notes: workDetail.special_notes,
          safety_notes: workDetail.safety_notes,
          materials_used: workDetail.materials.join(', '),
          equipment_used: workDetail.equipment.join(', '),
          weather: getRandomItem(['맑음', '흐림', '비', '눈', '구름조금']),
          temperature: Math.floor(Math.random() * 20) + 10, // 10~30도
          ptw_number: `PTW-2025-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
          ptw_status: 'approved',
          progress_percentage: Math.floor(Math.random() * 30) + 60 // 60~90%
        })
        .eq('id', report.id);

      if (updateError) {
        console.error(`작업일지 ${report.id} 업데이트 실패:`, updateError);
      } else {
        console.log(`✅ 작업일지 업데이트: ${report.work_date} - ${workDetail.title}`);
      }
    }

    // 3. 문서 데이터 추가 (도면, PTW, 영수증 등)
    console.log('\n📁 문서 데이터 추가 중...\n');

    // 샘플 현장 ID (실제 데이터베이스의 site_id 사용)
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(3);

    if (sites && sites.length > 0) {
      for (const site of sites) {
        // 도면 문서 추가
        for (let i = 0; i < 3; i++) {
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              title: `${site.name} ${i + 1}층 도면`,
              file_type: 'blueprint',
              file_url: getRandomItem(SAMPLE_FILES.blueprints),
              file_size: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
              mime_type: 'application/pdf',
              category: '도면',
              site_id: site.id,
              is_public: true,
              description: `${site.name} ${i + 1}층 건축 도면입니다. 구조, 전기, 설비 통합 도면.`
            });

          if (!docError) {
            console.log(`✅ 도면 추가: ${site.name} ${i + 1}층`);
          }
        }

        // PTW 문서 추가
        for (let i = 0; i < 2; i++) {
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              title: `작업허가서 PTW-2025-${String(i + 100).padStart(3, '0')}`,
              file_type: 'ptw',
              file_url: getRandomItem(SAMPLE_FILES.ptw),
              file_size: Math.floor(Math.random() * 1000000) + 500000, // 0.5-1.5MB
              mime_type: 'application/pdf',
              category: 'PTW',
              site_id: site.id,
              is_public: false,
              description: '고위험 작업 허가서 - 크레인 작업, 용접 작업 포함'
            });

          if (!docError) {
            console.log(`✅ PTW 추가: PTW-2025-${String(i + 100).padStart(3, '0')}`);
          }
        }

        // 영수증 문서 추가
        for (let i = 0; i < 3; i++) {
          const receiptTypes = ['자재구매', '장비임대', '유류비', '기타경비'];
          const receiptType = getRandomItem(receiptTypes);
          
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              title: `${receiptType} 영수증 - ${new Date().toISOString().split('T')[0]}`,
              file_type: 'receipt',
              file_url: getRandomItem(SAMPLE_FILES.receipts),
              file_size: Math.floor(Math.random() * 500000) + 100000, // 0.1-0.6MB
              mime_type: 'application/pdf',
              category: '영수증',
              site_id: site.id,
              is_public: false,
              description: `${receiptType} 관련 영수증`,
              metadata: {
                amount: Math.floor(Math.random() * 5000000) + 100000,
                vendor: getRandomItem(['(주)건설자재', '대한중장비', 'SK에너지', '한국철강']),
                receipt_date: new Date().toISOString().split('T')[0]
              }
            });

          if (!docError) {
            console.log(`✅ 영수증 추가: ${receiptType}`);
          }
        }
      }
    }

    // 4. 작업 사진 테이블 생성 및 데이터 추가
    console.log('\n📸 작업 사진 데이터 구조 생성 중...\n');

    // daily_report_photos 테이블이 없다면 생성
    const createPhotosTable = `
      CREATE TABLE IF NOT EXISTS daily_report_photos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        caption TEXT,
        photo_type TEXT CHECK (photo_type IN ('before', 'during', 'after', 'safety', 'quality')),
        taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        uploaded_by UUID REFERENCES profiles(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 5. 자재 사용 내역 테이블
    const createMaterialsTable = `
      CREATE TABLE IF NOT EXISTS daily_report_materials (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
        material_name TEXT NOT NULL,
        quantity DECIMAL(10,2),
        unit TEXT,
        supplier TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 6. 경비 영수증 테이블
    const createExpenseTable = `
      CREATE TABLE IF NOT EXISTS expense_receipts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
        expense_type TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        vendor TEXT,
        receipt_url TEXT,
        receipt_number TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('\n✨ 데이터베이스 콘텐츠 보강 완료!\n');
    console.log('📊 요약:');
    console.log(`- 작업일지 상세 내용 추가: ${reports.length}개`);
    console.log(`- 도면 문서 추가: ${sites ? sites.length * 3 : 0}개`);
    console.log(`- PTW 문서 추가: ${sites ? sites.length * 2 : 0}개`);
    console.log(`- 영수증 추가: ${sites ? sites.length * 3 : 0}개`);
    console.log('\n🎯 Playwright 테스트를 위한 충분한 데이터가 준비되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
enrichDatabaseContent();