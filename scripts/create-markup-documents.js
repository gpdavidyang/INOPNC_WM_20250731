#!/usr/bin/env node

/**
 * 도면마킹용 샘플 문서 데이터 생성 스크립트
 * markup_documents 테이블에 건설 도면들을 추가
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

// 도면마킹용 샘플 문서 데이터
const markupDocuments = [
  {
    title: '강남A현장 1층 평면도',
    description: '1층 구조 평면도 - 기둥, 보, 슬라브 배치',
    original_blueprint_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop&crop=focalpoint',
    original_blueprint_filename: '강남A현장_1층평면도_v2.1.jpg',
    markup_data: [
      {
        id: 'mark1',
        type: 'box',
        x: 150,
        y: 100,
        width: 80,
        height: 60,
        color: '#ff0000',
        label: '철근 검측',
        timestamp: new Date().toISOString()
      },
      {
        id: 'mark2',
        type: 'text',
        x: 300,
        y: 200,
        text: '콘크리트 타설 완료',
        color: '#0000ff',
        fontSize: 14,
        timestamp: new Date().toISOString()
      }
    ],
    location: 'personal',
    file_size: 1536000, // 1.5MB
    markup_count: 2
  },
  {
    title: '강남A현장 2층 평면도',
    description: '2층 구조 평면도 - 작업 진행 현황 마킹',
    original_blueprint_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=800&fit=crop&crop=focalpoint',
    original_blueprint_filename: '강남A현장_2층평면도_v1.8.jpg',
    markup_data: [
      {
        id: 'mark3',
        type: 'box',
        x: 200,
        y: 150,
        width: 100,
        height: 80,
        color: '#00ff00',
        label: '작업 완료',
        timestamp: new Date().toISOString()
      }
    ],
    location: 'personal',
    file_size: 1728000, // 1.7MB
    markup_count: 1
  },
  {
    title: '현장 배치도 (전체)',
    description: '현장 전체 배치도 - 크레인, 자재 보관소, 사무실 위치',
    original_blueprint_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&h=900&fit=crop&crop=focalpoint',
    original_blueprint_filename: '현장배치도_전체_2024.jpg',
    markup_data: [
      {
        id: 'mark4',
        type: 'box',
        x: 100,
        y: 80,
        width: 120,
        height: 90,
        color: '#ffaa00',
        label: '크레인 설치 구역',
        timestamp: new Date().toISOString()
      },
      {
        id: 'mark5',
        type: 'text',
        x: 400,
        y: 300,
        text: '자재 보관소',
        color: '#8000ff',
        fontSize: 16,
        timestamp: new Date().toISOString()
      },
      {
        id: 'mark6',
        type: 'drawing',
        points: [
          { x: 500, y: 200 },
          { x: 520, y: 220 },
          { x: 540, y: 200 },
          { x: 520, y: 240 }
        ],
        color: '#ff0080',
        strokeWidth: 3,
        timestamp: new Date().toISOString()
      }
    ],
    location: 'shared',
    file_size: 2048000, // 2MB
    markup_count: 3
  },
  {
    title: '지하층 구조도',
    description: '지하 1층 구조 상세도 - 기초 공사 현황',
    original_blueprint_url: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&h=800&fit=crop&crop=focalpoint',
    original_blueprint_filename: '지하층_구조도_v3.2.jpg',
    markup_data: [
      {
        id: 'mark7',
        type: 'box',
        x: 180,
        y: 120,
        width: 90,
        height: 70,
        color: '#ff6600',
        label: '기초 굴착 완료',
        timestamp: new Date().toISOString()
      },
      {
        id: 'mark8',
        type: 'text',
        x: 350,
        y: 180,
        text: '배수 시설 설치 예정',
        color: '#0066ff',
        fontSize: 12,
        timestamp: new Date().toISOString()
      }
    ],
    location: 'personal',
    file_size: 1792000, // 1.75MB
    markup_count: 2
  },
  {
    title: '옥상층 평면도',
    description: '옥상층 설비 배치도 - 급배수, 전기 설비',
    original_blueprint_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&crop=focalpoint',
    original_blueprint_filename: '옥상층_평면도_설비.jpg',
    markup_data: [
      {
        id: 'mark9',
        type: 'box',
        x: 250,
        y: 100,
        width: 110,
        height: 85,
        color: '#00ccff',
        label: '급수탱크 설치 위치',
        timestamp: new Date().toISOString()
      }
    ],
    location: 'shared',
    file_size: 1638400, // 1.6MB
    markup_count: 1
  },
  {
    title: '전기 배선도 (1층)',
    description: '1층 전기 배선 및 콘센트 배치도',
    original_blueprint_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&crop=focalpoint',
    original_blueprint_filename: '전기배선도_1층_v2.0.jpg',
    markup_data: [
      {
        id: 'mark10',
        type: 'text',
        x: 200,
        y: 150,
        text: '배전반 위치 확정',
        color: '#ff3300',
        fontSize: 14,
        timestamp: new Date().toISOString()
      },
      {
        id: 'mark11',
        type: 'box',
        x: 320,
        y: 200,
        width: 80,
        height: 60,
        color: '#33ff00',
        label: '작업 완료',
        timestamp: new Date().toISOString()
      }
    ],
    location: 'personal',
    file_size: 1456000, // 1.4MB
    markup_count: 2
  },
  {
    title: '소방 설비도',
    description: '소방 시설 배치 및 피난 경로도',
    original_blueprint_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop&crop=focalpoint',
    original_blueprint_filename: '소방설비도_종합_v1.5.jpg',
    markup_data: [
      {
        id: 'mark12',
        type: 'drawing',
        points: [
          { x: 150, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 150 },
          { x: 250, y: 150 }
        ],
        color: '#ff0000',
        strokeWidth: 4,
        timestamp: new Date().toISOString()
      },
      {
        id: 'mark13',
        type: 'text',
        x: 180,
        y: 200,
        text: '비상구 표시',
        color: '#ff0000',
        fontSize: 16,
        timestamp: new Date().toISOString()
      }
    ],
    location: 'shared',
    file_size: 1843200, // 1.8MB
    markup_count: 2
  },
  {
    title: '외부 입면도 (남측)',
    description: '건물 남쪽 입면도 - 외장재 및 창호 계획',
    original_blueprint_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&h=900&fit=crop&crop=focalpoint',
    original_blueprint_filename: '외부입면도_남측_최종.jpg',
    markup_data: [
      {
        id: 'mark14',
        type: 'box',
        x: 300,
        y: 120,
        width: 95,
        height: 75,
        color: '#8B4513',
        label: '외장재 시공 중',
        timestamp: new Date().toISOString()
      }
    ],
    location: 'personal',
    file_size: 2211840, // 2.1MB
    markup_count: 1
  }
]

async function createMarkupDocuments() {
  try {
    console.log('🔍 사용자 정보 조회 중...')
    
    // 활성 사용자들 조회 (도면 작업에 참여하는 사용자들)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('status', 'active')
      .limit(5)

    if (profilesError) {
      throw new Error(`프로필 조회 실패: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('활성 사용자가 없습니다.')
    }

    console.log(`✅ ${profiles.length}명의 사용자 발견:`, profiles.map(p => `${p.email}(${p.role})`))

    // 현장 정보 조회
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3)

    if (sitesError) {
      console.warn('⚠️ 현장 정보 조회 실패:', sitesError.message)
    }

    console.log('🔍 기존 마킹 도면 확인 중...')
    const { data: existingDocs } = await supabase
      .from('markup_documents')
      .select('title')

    const existingTitles = existingDocs?.map(doc => doc.title) || []
    console.log(`📋 기존 마킹 도면 ${existingTitles.length}개 발견`)

    console.log('📝 새 마킹 도면 생성 중...')
    const documentsToCreate = []

    markupDocuments.forEach((doc, index) => {
      if (existingTitles.includes(doc.title)) {
        console.log(`⏩ 건너뛰기: ${doc.title} (이미 존재)`)
        return
      }

      const creator = profiles[index % profiles.length]
      const site = sites && sites.length > 0 ? sites[index % sites.length] : null

      documentsToCreate.push({
        ...doc,
        created_by: creator.id,
        site_id: site?.id || null,
        created_at: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString(), // 최근 45일 내 랜덤
        updated_at: new Date().toISOString(),
        preview_image_url: doc.original_blueprint_url // 미리보기로 원본 이미지 사용
      })
    })

    if (documentsToCreate.length === 0) {
      console.log('✅ 모든 마킹 도면이 이미 존재합니다.')
      return
    }

    console.log(`📄 ${documentsToCreate.length}개 새 마킹 도면 생성 중...`)

    const { data: newDocuments, error: insertError } = await supabase
      .from('markup_documents')
      .insert(documentsToCreate)
      .select()

    if (insertError) {
      throw new Error(`마킹 도면 생성 실패: ${insertError.message}`)
    }

    console.log('✅ 마킹 도면 생성 완료!')
    console.log('📋 생성된 마킹 도면들:')
    newDocuments?.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.title}`)
      console.log(`     위치: ${doc.location === 'personal' ? '개인' : '공유'}`)
      console.log(`     마킹 수: ${doc.markup_count}개`)
      console.log(`     크기: ${(doc.file_size / 1024 / 1024).toFixed(1)}MB`)
      console.log(`     작성자: ${profiles.find(p => p.id === doc.created_by)?.email}`)
      console.log(`     도면 URL: ${doc.original_blueprint_url}`)
      console.log('')
    })

    console.log('🎉 도면마킹 샘플 데이터 생성이 완료되었습니다!')
    console.log('💡 이제 문서함 > 도면마킹에서 다음 기능들을 테스트할 수 있습니다:')
    console.log('  📝 마킹 편집: 박스, 텍스트, 펜 그리기')
    console.log('  👁️ 미리보기: 마킹된 도면 확인')
    console.log('  💾 저장/불러오기: 작업 내용 저장')
    console.log('  🔄 개인/공유: 개인 작업 및 팀 공유')
    
    console.log('\n📊 생성된 마킹 도면 분류:')
    const personalDocs = newDocuments?.filter(doc => doc.location === 'personal').length || 0
    const sharedDocs = newDocuments?.filter(doc => doc.location === 'shared').length || 0
    console.log(`  - 개인 도면: ${personalDocs}개`)
    console.log(`  - 공유 도면: ${sharedDocs}개`)
    console.log(`  - 전체: ${newDocuments?.length || 0}개`)

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  createMarkupDocuments()
}

module.exports = { createMarkupDocuments }