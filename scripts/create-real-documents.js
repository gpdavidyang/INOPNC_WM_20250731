const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 실제 사용 가능한 공개 샘플 파일 URL들
const REAL_SAMPLE_FILES = {
  blueprints: [
    {
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      title: '건축 도면 - 1층 평면도',
      description: '1층 전체 평면도 및 구조 상세'
    },
    {
      url: 'https://www.africau.edu/images/default/sample.pdf',
      title: '건축 도면 - 지하층 구조도',
      description: '지하 주차장 및 기계실 배치도'
    }
  ],
  ptw: [
    {
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      title: 'PTW-2025-001 고소작업 허가서',
      description: '3층 이상 고소작업 안전 허가서'
    },
    {
      url: 'https://www.africau.edu/images/default/sample.pdf',
      title: 'PTW-2025-002 화기작업 허가서',
      description: '용접 및 절단 작업 허가서'
    }
  ],
  photos: [
    {
      url: 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Construction+Site+Before',
      title: '작업 전 현장 사진',
      description: '2025년 8월 21일 오전 작업 시작 전 현장 상태'
    },
    {
      url: 'https://via.placeholder.com/800x600/7FBA00/FFFFFF?text=Work+In+Progress',
      title: '작업 진행 중 사진',
      description: '콘크리트 타설 작업 진행 중'
    },
    {
      url: 'https://via.placeholder.com/800x600/F25022/FFFFFF?text=Safety+Check',
      title: '안전 점검 사진',
      description: '안전 장비 착용 상태 점검'
    },
    {
      url: 'https://via.placeholder.com/800x600/00BCF2/FFFFFF?text=Quality+Control',
      title: '품질 확인 사진',
      description: '콘크리트 슬럼프 테스트 실시'
    },
    {
      url: 'https://via.placeholder.com/800x600/FFC000/FFFFFF?text=Work+Complete',
      title: '작업 완료 후 사진',
      description: '당일 작업 완료 후 정리된 현장'
    }
  ],
  receipts: [
    {
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      title: '자재 구매 영수증',
      description: '레미콘 30㎥ 구매 - (주)한국레미콘'
    },
    {
      url: 'https://www.africau.edu/images/default/sample.pdf',
      title: '장비 임대 영수증',
      description: '25톤 크레인 일일 임대 - 대한중장비'
    }
  ]
};

async function createRealDocuments() {
  try {
    console.log('🚀 실제 문서 데이터 생성 시작...\n');

    // 1. 현장 정보 조회
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3);

    if (!sites || sites.length === 0) {
      console.error('❌ 활성 현장이 없습니다.');
      return;
    }

    console.log(`🏗️ ${sites.length}개 현장에 문서 추가 예정\n`);

    let totalCreated = 0;
    let categoryCount = {
      '도면': 0,
      'PTW': 0,
      '현장사진': 0,
      '영수증': 0,
      '작업지시서': 0,
      '안전문서': 0
    };

    // 2. 각 현장별로 문서 생성
    for (const site of sites) {
      console.log(`\n📍 ${site.name} 문서 생성 중...`);

      // 도면 문서
      for (const blueprint of REAL_SAMPLE_FILES.blueprints) {
        const { error } = await supabase
          .from('documents')
          .insert({
            title: `${site.name} - ${blueprint.title}`,
            file_url: blueprint.url,
            file_type: 'document',
            mime_type: 'application/pdf',
            file_size: 1024 * 100, // 100KB
            category: '도면',
            site_id: site.id,
            is_public: true,
            description: blueprint.description,
            tags: ['도면', '건축', site.name],
            version: '1.0',
            created_at: new Date().toISOString()
          });

        if (!error) {
          categoryCount['도면']++;
          totalCreated++;
          console.log(`  ✅ 도면 추가: ${blueprint.title}`);
        }
      }

      // PTW 문서
      for (const ptw of REAL_SAMPLE_FILES.ptw) {
        const { error } = await supabase
          .from('documents')
          .insert({
            title: ptw.title,
            file_url: ptw.url,
            file_type: 'document',
            mime_type: 'application/pdf',
            file_size: 1024 * 80,
            category: 'PTW',
            site_id: site.id,
            is_public: false,
            description: ptw.description,
            tags: ['PTW', '안전', '작업허가서'],
            version: '1.0',
            created_at: new Date().toISOString()
          });

        if (!error) {
          categoryCount['PTW']++;
          totalCreated++;
          console.log(`  ✅ PTW 추가: ${ptw.title}`);
        }
      }

      // 현장 사진
      for (const photo of REAL_SAMPLE_FILES.photos) {
        const { error } = await supabase
          .from('documents')
          .insert({
            title: `${site.name} - ${photo.title}`,
            file_url: photo.url,
            file_type: 'image',
            mime_type: 'image/jpeg',
            file_size: 1024 * 500, // 500KB
            category: '현장사진',
            site_id: site.id,
            is_public: true,
            description: photo.description,
            tags: ['사진', '현장기록', new Date().toLocaleDateString('ko-KR')],
            metadata: {
              taken_date: new Date().toISOString(),
              location: site.name,
              photographer: '현장관리자'
            },
            created_at: new Date().toISOString()
          });

        if (!error) {
          categoryCount['현장사진']++;
          totalCreated++;
          console.log(`  ✅ 사진 추가: ${photo.title}`);
        }
      }

      // 영수증
      for (const receipt of REAL_SAMPLE_FILES.receipts) {
        const { error } = await supabase
          .from('documents')
          .insert({
            title: `${site.name} - ${receipt.title}`,
            file_url: receipt.url,
            file_type: 'document',
            mime_type: 'application/pdf',
            file_size: 1024 * 50,
            category: '영수증',
            site_id: site.id,
            is_public: false,
            description: receipt.description,
            tags: ['영수증', '경비', '회계'],
            metadata: {
              amount: Math.floor(Math.random() * 5000000) + 500000,
              vendor: receipt.description.split(' - ')[1] || '업체명',
              payment_date: new Date().toISOString().split('T')[0]
            },
            created_at: new Date().toISOString()
          });

        if (!error) {
          categoryCount['영수증']++;
          totalCreated++;
          console.log(`  ✅ 영수증 추가: ${receipt.title}`);
        }
      }

      // 추가 문서 타입들
      const additionalDocs = [
        {
          title: `${site.name} 작업지시서`,
          category: '작업지시서',
          description: '금일 작업 지시 사항 및 안전 수칙',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        },
        {
          title: `${site.name} 안전관리계획서`,
          category: '안전문서',
          description: '현장 안전관리 종합 계획서',
          url: 'https://www.africau.edu/images/default/sample.pdf'
        }
      ];

      for (const doc of additionalDocs) {
        const { error } = await supabase
          .from('documents')
          .insert({
            title: doc.title,
            file_url: doc.url,
            file_type: 'document',
            mime_type: 'application/pdf',
            file_size: 1024 * 200,
            category: doc.category,
            site_id: site.id,
            is_public: true,
            description: doc.description,
            tags: [doc.category, site.name],
            created_at: new Date().toISOString()
          });

        if (!error) {
          categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
          totalCreated++;
          console.log(`  ✅ ${doc.category} 추가: ${doc.title}`);
        }
      }
    }

    // 3. 공통 문서 (현장 무관)
    console.log('\n📄 공통 문서 생성 중...');
    
    const commonDocs = [
      {
        title: '건설안전보건관리 매뉴얼',
        category: '안전문서',
        description: '건설현장 안전보건 관리 표준 매뉴얼',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      },
      {
        title: '품질관리 체크리스트',
        category: '품질문서',
        description: '공종별 품질관리 체크리스트',
        url: 'https://www.africau.edu/images/default/sample.pdf'
      },
      {
        title: '표준 작업 절차서 (SOP)',
        category: '작업지시서',
        description: '주요 공종별 표준 작업 절차',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ];

    for (const doc of commonDocs) {
      const { error } = await supabase
        .from('documents')
        .insert({
          title: doc.title,
          file_url: doc.url,
          file_type: 'document',
          mime_type: 'application/pdf',
          file_size: 1024 * 300,
          category: doc.category,
          site_id: null, // 공통 문서
          is_public: true,
          description: doc.description,
          tags: ['공통', doc.category, '표준문서'],
          created_at: new Date().toISOString()
        });

      if (!error) {
        totalCreated++;
        console.log(`  ✅ 공통문서 추가: ${doc.title}`);
      }
    }

    // 4. 결과 요약
    console.log('\n✨ 실제 문서 데이터 생성 완료!\n');
    console.log('📊 생성된 문서 요약:');
    console.log(`- 총 문서 수: ${totalCreated}개`);
    console.log('\n📁 카테고리별 문서:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`  - ${category}: ${count}개`);
      }
    });
    
    console.log('\n🔗 문서 특징:');
    console.log('  ✅ 실제 접근 가능한 URL 사용');
    console.log('  ✅ PDF 문서 (도면, PTW, 영수증)');
    console.log('  ✅ 이미지 파일 (현장 사진)');
    console.log('  ✅ 메타데이터 포함');
    console.log('  ✅ 태그 및 버전 정보');
    
    console.log('\n🎯 Playwright 테스트 가능 항목:');
    console.log('  • 문서 목록 조회');
    console.log('  • 카테고리별 필터링');
    console.log('  • 문서 미리보기');
    console.log('  • 다운로드 링크 확인');
    console.log('  • 현장별 문서 조회');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
createRealDocuments();