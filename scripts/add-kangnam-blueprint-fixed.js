/**
 * 강남A현장 공도면 등록 스크립트 (documents 테이블 사용)
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addKangnamBlueprint() {
  try {
    console.log('🔍 강남A현장 검색 중...')
    
    // 강남A현장 찾기
    const { data: sites, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .ilike('name', '%강남%A%')
    
    if (siteError) {
      console.error('사이트 검색 오류:', siteError)
      return
    }
    
    if (!sites || sites.length === 0) {
      console.log('강남A현장을 찾을 수 없습니다. 사용 가능한 현장:')
      const { data: allSites } = await supabase
        .from('sites')
        .select('id, name')
        .limit(10)
      
      if (allSites) {
        allSites.forEach(site => console.log(`- ${site.name} (${site.id})`))
      }
      return
    }
    
    const kangnamSite = sites[0]
    console.log(`✅ 강남A현장 발견: ${kangnamSite.name} (${kangnamSite.id})`)
    
    // 기존 blueprint 문서 확인
    const { data: existingBlueprints } = await supabase
      .from('documents')
      .select('*')
      .eq('site_id', kangnamSite.id)
      .eq('document_type', 'blueprint')
    
    if (existingBlueprints && existingBlueprints.length > 0) {
      console.log('📋 기존 blueprint 문서가 있습니다:')
      existingBlueprints.forEach(doc => console.log(`  - ${doc.title} (${doc.id})`))
    }
    
    // 새 blueprint 문서 등록
    console.log('📁 새 blueprint 문서 등록 중...')
    const { data: newDocument, error: insertError } = await supabase
      .from('documents')
      .insert([
        {
          title: '강남A현장 공도면',
          description: '강남A현장 지하1층 구간 공사 도면',
          file_url: '/docs/강남A현장_공도면.jpg',
          file_name: '강남A현장_공도면.jpg',
          file_size: null,
          mime_type: 'image/jpeg',
          document_type: 'blueprint',
          folder_path: '/docs',
          owner_id: null, // 시스템 관리 문서
          is_public: false,
          site_id: kangnamSite.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (insertError) {
      console.error('문서 등록 오류:', insertError)
      return
    }
    
    console.log('🎉 강남A현장 공도면이 성공적으로 등록되었습니다!')
    console.log('📄 등록된 문서:', newDocument[0])
    
    // 등록 확인
    const { data: verification } = await supabase
      .from('documents')
      .select('*')
      .eq('site_id', kangnamSite.id)
      .eq('document_type', 'blueprint')
    
    if (verification && verification.length > 0) {
      console.log('✅ 등록 확인 완료! 이제 오늘의 현장정보에서 미리보기가 가능합니다.')
      console.log(`📋 총 ${verification.length}개의 blueprint 문서가 등록되어 있습니다.`)
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error)
  }
}

// 스크립트 실행
addKangnamBlueprint()