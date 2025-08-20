#!/usr/bin/env node

/**
 * 통합된 문서 데이터 생성 스크립트
 * 작업자, 현장, 날짜 등 실제 관계성을 반영한 문서 데이터 생성
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

async function createIntegratedDocuments() {
  try {
    console.log('🔍 기존 데이터 조회 중...')
    
    // 1. 활성 사용자 조회
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('status', 'active')
      .order('email')

    if (profilesError) {
      throw new Error(`프로필 조회 실패: ${profilesError.message}`)
    }

    console.log(`✅ ${profiles.length}명의 사용자 발견`)

    // 2. 활성 현장 조회
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address, start_date, end_date')
      .eq('status', 'active')
      .order('name')

    if (sitesError) {
      throw new Error(`현장 조회 실패: ${sitesError.message}`)
    }

    console.log(`✅ ${sites.length}개 현장 발견`)

    // 3. 현장 배정 관계 조회
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select(`
        id, user_id, site_id, assigned_date, is_active
      `)
      .eq('is_active', true)

    if (assignmentsError) {
      throw new Error(`현장 배정 조회 실패: ${assignmentsError.message}`)
    }

    // 사용자와 현장 정보를 수동으로 매핑
    const enrichedAssignments = assignments.map(assignment => {
      const user = profiles.find(p => p.id === assignment.user_id)
      const site = sites.find(s => s.id === assignment.site_id)
      return {
        ...assignment,
        profiles: user,
        sites: site
      }
    }).filter(assignment => assignment.profiles && assignment.sites)

    console.log(`✅ ${enrichedAssignments.length}개의 유효한 현장 배정 관계 발견`)

    // 4. 작업일지 데이터 조회 (문서와 연결할 실제 작업 내용)
    const { data: dailyReports, error: reportsError } = await supabase
      .from('daily_reports')
      .select(`
        id, site_id, work_date, work_description, weather_condition, created_by
      `)
      .order('work_date', { ascending: false })
      .limit(20)

    if (reportsError) {
      console.warn('⚠️ 작업일지 조회 실패:', reportsError.message)
    }

    // 작업일지도 수동으로 관계 연결
    const enrichedReports = dailyReports?.map(report => {
      const creator = profiles.find(p => p.id === report.created_by)
      const site = sites.find(s => s.id === report.site_id)
      return {
        ...report,
        profiles: creator,
        sites: site
      }
    }) || []

    console.log(`✅ ${enrichedReports.length}개의 작업일지 발견`)

    // 5. 기존 문서 정리 (중복 방지)
    console.log('🗑️ 기존 샘플 문서 정리 중...')
    
    await supabase.from('documents').delete().eq('document_type', 'personal')
    await supabase.from('documents').delete().eq('document_type', 'shared')
    await supabase.from('markup_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('✅ 기존 샘플 문서 정리 완료')

    // 6. 실제 관계성을 반영한 문서 생성
    await createPersonalDocuments(enrichedAssignments, enrichedReports)
    await createSharedDocuments(sites, profiles)
    await createMarkupDocuments(enrichedAssignments, sites)

    console.log('🎉 통합 문서 데이터 생성이 완료되었습니다!')
    console.log('💡 이제 모든 문서가 실제 사용자, 현장, 작업일지와 연결되어 있습니다.')

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

async function createPersonalDocuments(assignments, dailyReports) {
  console.log('📁 개인 문서 생성 중...')

  const personalDocTemplates = [
    {
      titleTemplate: '{user_name}님 작업일지_{date}',
      description: '{site_name}에서의 {date} 작업 내용 보고서',
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      mime_type: 'application/pdf',
      document_type: 'personal',
      category: 'work-reports'
    },
    {
      titleTemplate: '{user_name}_안전점검표_{date}',
      description: '{site_name} 현장 안전점검 체크리스트',
      file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_DOC_10kB.doc',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      document_type: 'personal',
      category: 'safety-docs'
    },
    {
      titleTemplate: '{site_name}_현장사진_{date}',
      description: '{user_name}님이 촬영한 {site_name} 현장 작업 사진',
      file_url: 'https://picsum.photos/800/600?random={random}',
      mime_type: 'image/jpeg',
      document_type: 'personal',
      category: 'photos'
    }
  ]

  const personalDocs = []

  // 각 현장 배정에 대해 개인 문서 생성
  assignments.slice(0, 10).forEach((assignment, index) => {
    const user = assignment.profiles
    const site = assignment.sites
    const assignedDate = new Date(assignment.assigned_date)

    personalDocTemplates.forEach((template, templateIndex) => {
      // 배정일 이후 랜덤한 날짜 생성
      const workDate = new Date(assignedDate)
      workDate.setDate(workDate.getDate() + Math.floor(Math.random() * 30))
      const dateStr = workDate.toISOString().split('T')[0]

      const doc = {
        title: template.titleTemplate
          .replace('{user_name}', user.full_name)
          .replace('{date}', dateStr)
          .replace('{site_name}', site.name),
        description: template.description
          .replace('{user_name}', user.full_name)
          .replace('{site_name}', site.name)
          .replace('{date}', dateStr),
        file_url: template.file_url.replace('{random}', index * 3 + templateIndex),
        file_name: `${template.category}_${user.full_name}_${dateStr}.${template.mime_type.split('/')[1].split('.')[0]}`,
        file_size: Math.floor(Math.random() * 5000000) + 500000, // 0.5MB - 5.5MB
        mime_type: template.mime_type,
        document_type: template.document_type,
        folder_path: `/personal/${user.full_name}/${template.category}`,
        owner_id: user.id,
        site_id: site.id,
        is_public: false,
        created_at: workDate.toISOString(),
        updated_at: workDate.toISOString()
      }

      personalDocs.push(doc)
    })
  })

  // 데이터베이스에 삽입
  const { data, error } = await supabase
    .from('documents')
    .insert(personalDocs)
    .select()

  if (error) {
    throw new Error(`개인 문서 생성 실패: ${error.message}`)
  }

  console.log(`✅ ${personalDocs.length}개의 개인 문서 생성 완료`)
}

async function createSharedDocuments(sites, profiles) {
  console.log('🤝 공유 문서 생성 중...')

  const sharedDocTemplates = [
    {
      titleTemplate: '{site_name}_안전수칙_가이드라인',
      description: '{site_name}에서 적용되는 안전수칙 및 가이드라인',
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      mime_type: 'application/pdf',
      document_type: 'shared',
      category: 'safety'
    },
    {
      titleTemplate: '{site_name}_작업일지_양식',
      description: '{site_name} 현장 표준 작업일지 작성 양식',
      file_url: 'https://file-examples.com/storage/fe86f2129638eb49d31e9d5/2017/10/file_example_XLS_10.xls',
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      document_type: 'shared',
      category: 'templates'
    },
    {
      titleTemplate: '{site_name}_현장_조직도',
      description: '{site_name} 현장 조직구조 및 담당자 연락처',
      file_url: 'https://picsum.photos/1200/800?random={random}',
      mime_type: 'image/png',
      document_type: 'shared',
      category: 'organization'
    }
  ]

  const sharedDocs = []
  const managers = profiles.filter(p => ['admin', 'site_manager', 'system_admin'].includes(p.role))

  sites.forEach((site, siteIndex) => {
    sharedDocTemplates.forEach((template, templateIndex) => {
      const manager = managers[siteIndex % managers.length]
      const createdDate = new Date(site.start_date)
      createdDate.setDate(createdDate.getDate() + Math.floor(Math.random() * 7)) // 현장 시작 후 1주일 내

      const doc = {
        title: template.titleTemplate.replace('{site_name}', site.name),
        description: template.description.replace('{site_name}', site.name),
        file_url: template.file_url.replace('{random}', siteIndex * 3 + templateIndex + 100),
        file_name: `${template.category}_${site.name}_${template.mime_type.split('/')[1].split('.')[0]}`,
        file_size: Math.floor(Math.random() * 8000000) + 1000000, // 1MB - 9MB
        mime_type: template.mime_type,
        document_type: template.document_type,
        folder_path: `/shared/${site.name}/${template.category}`,
        owner_id: manager.id,
        site_id: site.id,
        is_public: true,
        created_at: createdDate.toISOString(),
        updated_at: createdDate.toISOString()
      }

      sharedDocs.push(doc)
    })
  })

  // 데이터베이스에 삽입
  const { data, error } = await supabase
    .from('documents')
    .insert(sharedDocs)
    .select()

  if (error) {
    throw new Error(`공유 문서 생성 실패: ${error.message}`)
  }

  console.log(`✅ ${sharedDocs.length}개의 공유 문서 생성 완료`)
}

async function createMarkupDocuments(assignments, sites) {
  console.log('🎨 도면 마킹 문서 생성 중...')

  const markupTemplates = [
    {
      titleTemplate: '{site_name}_1층_평면도',
      description: '{site_name} 1층 구조 평면도 - 작업 진행 현황 마킹',
      blueprint_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop&crop=focalpoint',
      location: 'personal'
    },
    {
      titleTemplate: '{site_name}_현장_배치도',
      description: '{site_name} 전체 현장 배치도 - 장비 및 자재 위치',
      blueprint_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&h=900&fit=crop&crop=focalpoint',
      location: 'shared'
    },
    {
      titleTemplate: '{site_name}_전기_배선도',
      description: '{site_name} 전기 설비 및 배선 계획도',
      blueprint_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&crop=focalpoint',
      location: 'personal'
    }
  ]

  const markupDocs = []

  // 현장별로 도면 생성
  sites.forEach((site, siteIndex) => {
    markupTemplates.forEach((template, templateIndex) => {
      // 해당 현장에 배정된 사용자 찾기
      const siteAssignments = assignments.filter(a => a.site_id === site.id)
      if (siteAssignments.length === 0) return

      const assignment = siteAssignments[templateIndex % siteAssignments.length]
      const user = assignment.profiles

      // 배정일 이후 랜덤한 날짜에 도면 작성
      const workDate = new Date(assignment.assigned_date)
      workDate.setDate(workDate.getDate() + Math.floor(Math.random() * 20) + 5) // 5-25일 후

      // 실제 작업 내용을 반영한 마킹 데이터 생성
      const markupData = generateRealisticMarkings(template.titleTemplate, siteIndex, templateIndex)

      const doc = {
        title: template.titleTemplate.replace('{site_name}', site.name),
        description: template.description.replace('{site_name}', site.name),
        original_blueprint_url: template.blueprint_url,
        original_blueprint_filename: `${site.name}_${template.titleTemplate.split('_')[1]}_도면.jpg`,
        markup_data: markupData,
        preview_image_url: template.blueprint_url,
        location: template.location,
        created_by: user.id,
        site_id: site.id,
        file_size: Math.floor(Math.random() * 3000000) + 1000000, // 1-4MB
        markup_count: markupData.length,
        created_at: workDate.toISOString(),
        updated_at: workDate.toISOString()
      }

      markupDocs.push(doc)
    })
  })

  // 데이터베이스에 삽입
  const { data, error } = await supabase
    .from('markup_documents')
    .insert(markupDocs)
    .select()

  if (error) {
    throw new Error(`마킹 문서 생성 실패: ${error.message}`)
  }

  console.log(`✅ ${markupDocs.length}개의 마킹 도면 생성 완료`)
}

function generateRealisticMarkings(titleTemplate, siteIndex, templateIndex) {
  const markings = []
  const baseId = `mark_${siteIndex}_${templateIndex}`

  // 도면 유형에 따른 현실적인 마킹 생성
  if (titleTemplate.includes('평면도')) {
    markings.push({
      id: `${baseId}_1`,
      type: 'box',
      x: 100 + (siteIndex * 50),
      y: 80 + (templateIndex * 40),
      width: 90,
      height: 70,
      color: '#ff0000',
      label: '철근 배근 완료',
      timestamp: new Date().toISOString()
    })

    markings.push({
      id: `${baseId}_2`,
      type: 'text',
      x: 250 + (siteIndex * 30),
      y: 150 + (templateIndex * 50),
      text: '콘크리트 타설 예정',
      color: '#0000ff',
      fontSize: 14,
      timestamp: new Date().toISOString()
    })
  } else if (titleTemplate.includes('배치도')) {
    markings.push({
      id: `${baseId}_1`,
      type: 'box',
      x: 150 + (siteIndex * 40),
      y: 100 + (templateIndex * 35),
      width: 120,
      height: 90,
      color: '#ffaa00',
      label: '크레인 설치 구역',
      timestamp: new Date().toISOString()
    })

    markings.push({
      id: `${baseId}_2`,
      type: 'drawing',
      points: [
        { x: 300 + (siteIndex * 20), y: 200 + (templateIndex * 30) },
        { x: 320 + (siteIndex * 20), y: 220 + (templateIndex * 30) },
        { x: 340 + (siteIndex * 20), y: 200 + (templateIndex * 30) }
      ],
      color: '#ff0080',
      strokeWidth: 3,
      timestamp: new Date().toISOString()
    })
  } else if (titleTemplate.includes('전기')) {
    markings.push({
      id: `${baseId}_1`,
      type: 'text',
      x: 180 + (siteIndex * 25),
      y: 120 + (templateIndex * 45),
      text: '배전반 설치 완료',
      color: '#ff3300',
      fontSize: 14,
      timestamp: new Date().toISOString()
    })
  }

  return markings
}

// 스크립트 실행
if (require.main === module) {
  createIntegratedDocuments()
}

module.exports = { createIntegratedDocuments }