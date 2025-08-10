import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkDocuments() {
  console.log('📊 문서 데이터베이스 확인...\n')
  
  // 관리자로 로그인
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@inopnc.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('❌ 인증 오류:', authError)
    return
  }
  
  console.log('✅ 로그인 성공: admin@inopnc.com')
  
  // 문서 테이블 확인
  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('*')
    .limit(10)
  
  if (documentsError) {
    console.error('❌ 문서 조회 오류:', documentsError)
  } else {
    console.log('📄 문서 테이블 데이터:')
    console.log('   총 문서 수:', documents?.length || 0, '개')
    if (documents && documents.length > 0) {
      documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title || doc.file_name}`)
        console.log(`      타입: ${doc.document_type}, 소유자: ${doc.owner_id}`)
      })
    } else {
      console.log('   ⚠️  문서가 없습니다.')
    }
  }
  
  // 프로필 확인
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .limit(5)
  
  if (!profilesError && profiles) {
    console.log('\n👥 사용자 프로필:')
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.email} (${profile.full_name}) - ID: ${profile.id}`)
    })
  }
}

checkDocuments().catch(console.error)