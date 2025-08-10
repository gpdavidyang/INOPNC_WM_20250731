import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function insertSampleDocuments() {
  console.log('📄 샘플 문서 데이터 생성 중...\n')

  try {
    // 사용자 ID들 가져오기
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
    
    if (profilesError) {
      console.error('❌ 프로필 조회 오류:', profilesError)
      return
    }

    const admin = profiles?.find(p => p.email === 'admin@inopnc.com')
    const manager = profiles?.find(p => p.email === 'manager@inopnc.com')
    const worker = profiles?.find(p => p.email === 'worker@inopnc.com')

    if (!admin || !manager || !worker) {
      console.log('⚠️  일부 사용자를 찾을 수 없습니다.')
      console.log('   Admin:', admin?.email)
      console.log('   Manager:', manager?.email)
      console.log('   Worker:', worker?.email)
    }

    // 사이트 ID 가져오기
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(3)

    const sampleDocuments = [
      // Worker 문서들 - personal 타입
      {
        title: '2025년 1월 급여명세서',
        description: '2025년 1월 급여 및 수당 내역',
        file_name: '급여명세서_2025-01.pdf',
        file_size: 245632,
        mime_type: 'application/pdf',
        document_type: 'personal',
        folder_path: 'personal/salary',
        file_url: 'https://example.com/salary-2025-01.pdf',
        owner_id: worker?.id,
        is_public: false,
        site_id: sites?.[0]?.id
      },
      {
        title: '작업일지_2025-01-30',
        description: '콘크리트 타설 작업 일지',
        file_name: '작업일지_2025-01-30.pdf',
        file_size: 1024567,
        mime_type: 'application/pdf',
        document_type: 'report',
        folder_path: 'personal/reports',
        file_url: 'https://example.com/daily-report-2025-01-30.pdf',
        owner_id: worker?.id,
        is_public: false,
        site_id: sites?.[0]?.id
      },
      {
        title: '건설기계조종사면허증',
        description: '굴삭기 운전 면허증',
        file_name: '건설기계조종사면허증.jpg',
        file_size: 845123,
        mime_type: 'image/jpeg',
        document_type: 'certificate',
        folder_path: 'personal/certificates',
        file_url: 'https://example.com/license-certificate.jpg',
        owner_id: worker?.id,
        is_public: false,
        site_id: sites?.[0]?.id
      },
      {
        title: '안전교육이수증_2025',
        description: '2025년 상반기 안전교육 이수증',
        file_name: '안전교육이수증_2025.pdf',
        file_size: 567890,
        mime_type: 'application/pdf',
        document_type: 'certificate',
        folder_path: 'personal/safety',
        file_url: 'https://example.com/safety-certificate-2025.pdf',
        owner_id: worker?.id,
        is_public: false,
        site_id: sites?.[0]?.id
      },

      // Manager 문서들
      {
        title: '현장 안전관리계획서',
        description: '강남 A현장 안전관리 종합계획',
        file_name: '현장안전관리계획서_강남A.pdf',
        file_size: 3456789,
        mime_type: 'application/pdf',
        document_type: 'shared',
        folder_path: 'site/safety',
        file_url: 'https://example.com/safety-plan-gangnam.pdf',
        owner_id: manager?.id,
        is_public: true,
        site_id: sites?.[0]?.id
      },
      {
        title: '작업지침서_콘크리트타설',
        description: '콘크리트 타설 작업 표준 지침서',
        file_name: '작업지침서_콘크리트타설.pdf',
        file_size: 2345678,
        mime_type: 'application/pdf',
        document_type: 'shared',
        folder_path: 'shared/templates',
        file_url: 'https://example.com/concrete-work-guide.pdf',
        owner_id: manager?.id,
        is_public: true,
        site_id: sites?.[0]?.id
      },
      {
        title: '월간 현장보고서_2025년 1월',
        description: '강남 A현장 1월 진행상황 종합보고서',
        file_name: '월간현장보고서_2025-01.pdf',
        file_size: 4567890,
        mime_type: 'application/pdf',
        document_type: 'report',
        folder_path: 'site/reports',
        file_url: 'https://example.com/monthly-report-2025-01.pdf',
        owner_id: manager?.id,
        is_public: false,
        site_id: sites?.[0]?.id
      },

      // Admin 문서들
      {
        title: '2025년 안전관리규정',
        description: '회사 전체 안전관리 규정 및 절차',
        file_name: '2025년_안전관리규정.pdf',
        file_size: 5678901,
        mime_type: 'application/pdf',
        document_type: 'shared',
        folder_path: 'company/policies',
        file_url: 'https://example.com/safety-regulations-2025.pdf',
        owner_id: admin?.id,
        is_public: true,
        site_id: null
      },
      {
        title: 'MSDS_시멘트',
        description: '시멘트 물질안전보건자료',
        file_name: 'MSDS_시멘트.pdf',
        file_size: 567890,
        mime_type: 'application/pdf',
        document_type: 'shared',
        folder_path: 'company/msds',
        file_url: 'https://example.com/msds-cement.pdf',
        owner_id: admin?.id,
        is_public: true,
        site_id: null
      },
      {
        title: '작업일지 양식',
        description: '표준 작업일지 작성 양식',
        file_name: '작업일지_양식.xlsx',
        file_size: 45678,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        document_type: 'shared',
        folder_path: 'company/templates',
        file_url: 'https://example.com/work-log-template.xlsx',
        owner_id: admin?.id,
        is_public: true,
        site_id: null
      },
      {
        title: '2025년 연차사용안내',
        description: '2025년 연차휴가 사용 규정 및 신청방법',
        file_name: '2025년_연차사용안내.pdf',
        file_size: 234567,
        mime_type: 'application/pdf',
        document_type: 'shared',
        folder_path: 'company/notices',
        file_url: 'https://example.com/annual-leave-guide-2025.pdf',
        owner_id: admin?.id,
        is_public: true,
        site_id: null
      },

      // 공도면 문서들
      {
        title: '강남A현장_공도면_Rev3',
        description: '강남 A현장 시공도면 최신버전',
        file_name: '강남A현장_공도면_Rev3.dwg',
        file_size: 15678234,
        mime_type: 'application/dwg',
        document_type: 'blueprint',
        folder_path: 'site/blueprints',
        file_url: 'https://example.com/gangnam-blueprint-rev3.dwg',
        owner_id: manager?.id,
        is_public: true,
        site_id: sites?.[0]?.id
      },
      {
        title: '지하1층_공도면_최종',
        description: '지하1층 시공도면 최종승인본',
        file_name: '지하1층_공도면_최종.pdf',
        file_size: 8765432,
        mime_type: 'application/pdf',
        document_type: 'blueprint',
        folder_path: 'site/blueprints',
        file_url: 'https://example.com/basement-blueprint-final.pdf',
        owner_id: admin?.id,
        is_public: true,
        site_id: sites?.[0]?.id
      }
    ]

    // 문서 삽입
    const { data: insertedDocs, error: insertError } = await supabase
      .from('documents')
      .insert(sampleDocuments)
      .select()

    if (insertError) {
      console.error('❌ 문서 삽입 오류:', insertError)
      return
    }

    console.log('✅ 샘플 문서 삽입 완료!')
    console.log(`   총 ${insertedDocs?.length || 0}개 문서 생성`)
    
    // 카테고리별 통계
    const categories = {}
    insertedDocs?.forEach(doc => {
      const category = doc.document_type || 'unknown'
      categories[category] = (categories[category] || 0) + 1
    })
    
    console.log('\n📊 문서 타입별 수:')
    Object.entries(categories).forEach(([category, count]) => {
      const categoryName = {
        'personal': '개인문서',
        'shared': '공유문서',
        'blueprint': '공도면',
        'report': '보고서',
        'certificate': '자격증',
        'other': '기타'
      }[category] || category
      console.log(`   - ${categoryName}: ${count}개`)
    })

  } catch (error) {
    console.error('💥 예상치 못한 오류:', error)
  }
}

insertSampleDocuments().catch(console.error)