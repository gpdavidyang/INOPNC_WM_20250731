#!/usr/bin/env node

/**
 * 샘플 문서 데이터 생성 스크립트
 * 실제 파일 없이도 미리보기/다운로드 기능을 테스트할 수 있도록 
 * 온라인 샘플 파일들을 사용합니다.
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

// 샘플 문서 데이터 (실제 접근 가능한 온라인 파일들)
const sampleDocuments = [
  {
    title: '2024년 8월 작업일지.pdf',
    description: '8월 한달간 작업 내용 정리',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: '2024년_8월_작업일지.pdf',
    file_size: 1024576, // 1MB
    mime_type: 'application/pdf',
    document_type: 'report',
    folder_path: '/reports/2024/08'
  },
  {
    title: '안전점검표_8월.docx',
    description: '월별 안전점검 체크리스트',
    file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_DOC_10kB.doc',
    file_name: '안전점검표_2024_08.docx',
    file_size: 2048576, // 2MB
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    document_type: 'certificate',
    folder_path: '/safety/checklists'
  },
  {
    title: '현장사진_슬라브타설.jpg',
    description: '슬라브 콘크리트 타설 작업 현장 사진',
    file_url: 'https://picsum.photos/800/600?random=1',
    file_name: '현장사진_슬라브타설_20240820.jpg',
    file_size: 3145728, // 3MB
    mime_type: 'image/jpeg',
    document_type: 'other',
    folder_path: '/photos/construction'
  },
  {
    title: '시공계획서_최종.pdf',
    description: '프로젝트 시공 계획 최종 승인본',
    file_url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
    file_name: '시공계획서_최종_v2.1.pdf',
    file_size: 5242880, // 5MB
    mime_type: 'application/pdf',
    document_type: 'blueprint',
    folder_path: '/plans/construction'
  },
  {
    title: '건설기술자격증.pdf',
    description: '건설기술자 자격증명서',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: '건설기술자격증_김작업자.pdf',
    file_size: 512000, // 500KB
    mime_type: 'application/pdf',
    document_type: 'certificate',
    folder_path: '/certificates/personal'
  },
  {
    title: '작업지시서_8월3주차.xlsx',
    description: '8월 3주차 작업 지시 및 계획',
    file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_XLS_10.xls',
    file_name: '작업지시서_20240819_20240825.xlsx',
    file_size: 1536000, // 1.5MB
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    document_type: 'other',
    folder_path: '/instructions/weekly'
  },
  {
    title: '현장배치도.png',
    description: '현장 내 설비 및 작업 구역 배치도',
    file_url: 'https://picsum.photos/1200/800?random=2',
    file_name: '현장배치도_강남A현장.png',
    file_size: 2097152, // 2MB
    mime_type: 'image/png',
    document_type: 'blueprint',
    folder_path: '/blueprints/site-layout'
  },
  {
    title: '교육자료_안전보건.pdf',
    description: '건설현장 안전보건 교육 자료',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_name: '교육자료_안전보건_2024.pdf',
    file_size: 4194304, // 4MB
    mime_type: 'application/pdf',
    document_type: 'certificate',
    folder_path: '/education/safety'
  }
]

async function createSampleDocuments() {
  try {
    console.log('🔍 사용자 정보 조회 중...')
    
    // 현재 로그인된 사용자들 중에서 owner 선택
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('status', 'active')
      .limit(5)

    if (profilesError) {
      throw new Error(`프로필 조회 실패: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('활성 사용자가 없습니다.')
    }

    console.log(`✅ ${profiles.length}명의 사용자 발견:`, profiles.map(p => p.email))

    // 현장 정보 조회
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3)

    if (sitesError) {
      console.warn('⚠️ 현장 정보 조회 실패:', sitesError.message)
    }

    console.log('🔍 기존 문서 확인 중...')
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('title')

    const existingTitles = existingDocs?.map(doc => doc.title) || []
    console.log(`📋 기존 문서 ${existingTitles.length}개 발견`)

    console.log('📝 새 문서 생성 중...')
    const documentsToCreate = []

    sampleDocuments.forEach((doc, index) => {
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
        is_public: index % 3 === 0, // 3개 중 1개는 공개 문서
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    if (documentsToCreate.length === 0) {
      console.log('✅ 모든 샘플 문서가 이미 존재합니다.')
      return
    }

    console.log(`📄 ${documentsToCreate.length}개 새 문서 생성 중...`)

    const { data: newDocuments, error: insertError } = await supabase
      .from('documents')
      .insert(documentsToCreate)
      .select()

    if (insertError) {
      throw new Error(`문서 생성 실패: ${insertError.message}`)
    }

    console.log('✅ 문서 생성 완료!')
    console.log('📋 생성된 문서들:')
    newDocuments?.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.title} (${doc.mime_type})`)
      console.log(`     URL: ${doc.file_url}`)
      console.log(`     크기: ${(doc.file_size / 1024 / 1024).toFixed(1)}MB`)
      console.log('')
    })

    console.log('🎉 샘플 문서 생성이 완료되었습니다!')
    console.log('💡 이제 문서함에서 미리보기와 다운로드 기능을 테스트할 수 있습니다.')

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  createSampleDocuments()
}

module.exports = { createSampleDocuments }