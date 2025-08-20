/**
 * 강남A현장 공도면 등록 스크립트
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
  process.exit(1)
}

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
      .from('site_documents')
      .select('*')
      .eq('site_id', kangnamSite.id)
      .eq('document_type', 'blueprint')
      .eq('is_active', true)
    
    if (existingBlueprints && existingBlueprints.length > 0) {
      console.log('📋 기존 blueprint 문서가 있습니다. 비활성화 중...')
      await supabase
        .from('site_documents')
        .update({ is_active: false })
        .eq('site_id', kangnamSite.id)
        .eq('document_type', 'blueprint')
    }
    
    // 새 blueprint 문서 등록
    console.log('📁 새 blueprint 문서 등록 중...')
    const { data: newDocument, error: insertError } = await supabase
      .from('site_documents')
      .insert([
        {
          site_id: kangnamSite.id,
          document_type: 'blueprint',
          file_name: '강남A현장_공도면.jpg',
          file_url: '/docs/강남A현장_공도면.jpg',
          file_size: null,
          mime_type: 'image/jpeg',
          is_active: true,
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
      .from('site_documents')
      .select('*')
      .eq('site_id', kangnamSite.id)
      .eq('document_type', 'blueprint')
      .eq('is_active', true)
    
    if (verification && verification.length > 0) {
      console.log('✅ 등록 확인 완료! 이제 오늘의 현장정보에서 미리보기가 가능합니다.')
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error)
  }
}

// 스크립트 실행
addKangnamBlueprint()