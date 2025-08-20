/**
 * site_documents 테이블 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSiteDocumentsTable() {
  try {
    console.log('🔍 site_documents 테이블 확인 중...')
    
    // 테이블 존재 확인
    const { data, error } = await supabase
      .from('site_documents')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ site_documents 테이블 오류:', error)
      console.log('📋 사용 가능한 테이블을 확인해보겠습니다...')
      
      // 다른 문서 관련 테이블이 있는지 확인
      const tables = ['documents', 'site_document', 'blueprint_documents']
      for (const table of tables) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (!tableError) {
            console.log(`✅ ${table} 테이블이 존재합니다`)
            if (tableData && tableData.length > 0) {
              console.log(`   샘플 데이터:`, Object.keys(tableData[0]))
            }
          }
        } catch (e) {
          console.log(`❌ ${table} 테이블이 존재하지 않습니다`)
        }
      }
      return
    }
    
    console.log('✅ site_documents 테이블이 존재합니다!')
    if (data && data.length > 0) {
      console.log('📄 기존 문서:', data[0])
    } else {
      console.log('📋 테이블은 존재하지만 데이터가 없습니다.')
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error)
  }
}

// 스크립트 실행
checkSiteDocumentsTable()