#!/usr/bin/env node

/**
 * 공유문서함용 샘플 문서 데이터 생성 스크립트
 * is_public: true로 설정하여 공유문서함에 표시되도록 함
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 공유문서함용 샘플 문서 데이터
const sharedDocuments = [
  {
    title: '현장 안전수칙 가이드라인.pdf',
    description: '모든 현장 작업자가 숙지해야 할 안전수칙',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: '현장_안전수칙_가이드라인_2024.pdf',
    file_size: 2048576, // 2MB
    mime_type: 'application/pdf',
    document_type: 'shared',
    folder_path: '/shared/safety/guidelines'
  },
  {
    title: '작업일지 작성 양식.xlsx',
    description: '표준 작업일지 작성 템플릿',
    file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_XLS_10.xls',
    file_name: '작업일지_작성양식_v2.1.xlsx',
    file_size: 1024000, // 1MB
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    document_type: 'shared',
    folder_path: '/shared/templates/reports'
  },
  {
    title: '현장 표준 작업절차서.pdf',
    description: '건설현장 표준 작업절차 매뉴얼',
    file_url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
    file_name: '표준작업절차서_건설현장_v3.0.pdf',
    file_size: 4194304, // 4MB
    mime_type: 'application/pdf',
    document_type: 'shared',
    folder_path: '/shared/procedures/construction'
  },
  {
    title: '개인보호구 착용 가이드.jpg',
    description: '현장에서 필수 착용해야 할 개인보호구 안내',
    file_url: 'https://picsum.photos/1000/700?random=10',
    file_name: '개인보호구_착용가이드_포스터.jpg',
    file_size: 1572864, // 1.5MB
    mime_type: 'image/jpeg',
    document_type: 'shared',
    folder_path: '/shared/safety/posters'
  },
  {
    title: '긴급상황 대응 매뉴얼.docx',
    description: '화재, 사고 등 긴급상황 발생시 대응절차',
    file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_DOC_10kB.doc',
    file_name: '긴급상황_대응매뉴얼_2024.docx',
    file_size: 3145728, // 3MB
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    document_type: 'shared',
    folder_path: '/shared/emergency/procedures'
  },
  {
    title: '품질관리 체크리스트.xlsx',
    description: '시공 품질관리를 위한 점검항목',
    file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_XLS_10.xls',
    file_name: '품질관리_체크리스트_v1.3.xlsx',
    file_size: 2097152, // 2MB
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    document_type: 'shared',
    folder_path: '/shared/quality/checklists'
  },
  {
    title: '현장 조직도 및 연락처.png',
    description: '현장 조직구조 및 담당자 연락처',
    file_url: 'https://picsum.photos/1200/800?random=20',
    file_name: '현장조직도_연락처_2024.png',
    file_size: 1048576, // 1MB
    mime_type: 'image/png',
    document_type: 'shared',
    folder_path: '/shared/organization/contacts'
  },
  {
    title: '환경관리 계획서.pdf',
    description: '현장 환경보호 및 폐기물 관리계획',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: '환경관리_계획서_2024년도.pdf',
    file_size: 3670016, // 3.5MB
    mime_type: 'application/pdf',
    document_type: 'shared',
    folder_path: '/shared/environment/plans'
  },
  {
    title: '월간 안전교육 자료.pptx',
    description: '매월 실시하는 안전교육용 프레젠테이션',
    file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_PPT_1MB.ppt',
    file_name: '월간안전교육_8월_자료.pptx',
    file_size: 5242880, // 5MB
    mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    document_type: 'shared',
    folder_path: '/shared/education/monthly'
  },
  {
    title: '현장 출입 신청서 양식.pdf',
    description: '외부인 현장 출입시 필요한 신청서 양식',
    file_url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
    file_name: '현장출입_신청서양식_v2.0.pdf',
    file_size: 1024000, // 1MB
    mime_type: 'application/pdf',
    document_type: 'shared',
    folder_path: '/shared/forms/access'
  }
]

async function createSharedDocuments() {
  try {
    console.log('🔍 관리자 사용자 정보 조회 중...')
    
    // 관리자 또는 현장관리자 권한 사용자들 조회
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('role', ['admin', 'site_manager', 'system_admin'])
      .eq('status', 'active')
      .limit(5)

    if (profilesError) {
      throw new Error(`프로필 조회 실패: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('관리자 사용자가 없습니다.')
    }

    console.log(`✅ ${profiles.length}명의 관리자 발견:`, profiles.map(p => `${p.email}(${p.role})`))

    // 현장 정보 조회
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3)

    if (sitesError) {
      console.warn('⚠️ 현장 정보 조회 실패:', sitesError.message)
    }

    console.log('🔍 기존 공유문서 확인 중...')
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('title')
      .eq('is_public', true)

    const existingTitles = existingDocs?.map(doc => doc.title) || []
    console.log(`📋 기존 공유문서 ${existingTitles.length}개 발견`)

    console.log('📝 새 공유문서 생성 중...')
    const documentsToCreate = []

    sharedDocuments.forEach((doc, index) => {
      if (existingTitles.includes(doc.title)) {
        console.log(`⏩ 건너뛰기: ${doc.title} (이미 존재)`)
        return
      }

      const owner = profiles[index % profiles.length]
      const site = sites && sites.length > 0 ? sites[index % sites.length] : null

      documentsToCreate.push({
        ...doc,
        owner_id: owner.id,
        site_id: site?.id || null,
        is_public: true, // 공유문서함에 표시되도록 설정
        created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), // 최근 2개월 내 랜덤
        updated_at: new Date().toISOString()
      })
    })

    if (documentsToCreate.length === 0) {
      console.log('✅ 모든 공유문서가 이미 존재합니다.')
      return
    }

    console.log(`📄 ${documentsToCreate.length}개 새 공유문서 생성 중...`)

    const { data: newDocuments, error: insertError } = await supabase
      .from('documents')
      .insert(documentsToCreate)
      .select()

    if (insertError) {
      throw new Error(`문서 생성 실패: ${insertError.message}`)
    }

    console.log('✅ 공유문서 생성 완료!')
    console.log('📋 생성된 공유문서들:')
    newDocuments?.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.title}`)
      console.log(`     유형: ${doc.document_type} (${doc.mime_type})`)
      console.log(`     URL: ${doc.file_url}`)
      console.log(`     크기: ${(doc.file_size / 1024 / 1024).toFixed(1)}MB`)
      console.log(`     작성자: ${profiles.find(p => p.id === doc.owner_id)?.email}`)
      console.log('')
    })

    console.log('🎉 공유문서함 샘플 데이터 생성이 완료되었습니다!')
    console.log('💡 이제 문서함 > 공유문서함에서 미리보기와 다운로드 기능을 테스트할 수 있습니다.')
    console.log('📊 공유문서 특징:')
    console.log('  - is_public: true로 설정되어 모든 사용자가 볼 수 있음')
    console.log('  - 관리자/현장관리자가 업로드한 것으로 설정')
    console.log('  - 안전, 품질, 환경, 교육 등 다양한 카테고리 포함')

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  createSharedDocuments()
}

module.exports = { createSharedDocuments }