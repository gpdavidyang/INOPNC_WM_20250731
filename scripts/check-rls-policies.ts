import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkRLSPolicies() {
  console.log('🔒 RLS 정책 및 권한 확인 중...\n')

  // Check authentication status
  console.log('🚫 인증 상태:')
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.log('❌ 인증 실패:', authError.message)
    return
  }
  
  if (!user) {
    console.log('❌ 사용자 인증되지 않음 - 이것이 문제의 원인!')
    console.log('💡 해결방안: 로그인 후 데이터에 액세스해야 합니다.')
    
    console.log('\n🧪 테스트용으로 익명 권한으로 테이블 구조 확인:')
    
    // Try to get table structure (should work even without auth)
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('count', { count: 'exact', head: true })
      
      console.log('Sites 테이블 액세스 결과:', { count: data, error: error?.message })
    } catch (e) {
      console.log('Sites 테이블 액세스 실패:', e)
    }
    
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('count', { count: 'exact', head: true })
      
      console.log('Daily Reports 테이블 액세스 결과:', { count: data, error: error?.message })
    } catch (e) {
      console.log('Daily Reports 테이블 액세스 실패:', e)
    }

    return
  }
  
  console.log(`✅ 인증된 사용자: ${user.email}`)
  console.log(`   - User ID: ${user.id}`)
  
  // Check user profile
  console.log('\n👤 사용자 프로필:')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.log('❌ 프로필 조회 실패:', profileError.message)
    console.log('💡 문제: 인증된 사용자지만 profiles 테이블에 레코드가 없습니다.')
  } else {
    console.log(`✅ 프로필: ${profile.full_name} [${profile.role}]`)
  }
  
  // Check site assignments for user
  console.log('\n🎯 현장 할당 확인:')
  const { data: assignments, error: assignError } = await supabase
    .from('site_assignments')
    .select('*')
    .eq('user_id', user.id)
  
  if (assignError) {
    console.log('❌ 현장 할당 조회 실패:', assignError.message)
  } else if (!assignments || assignments.length === 0) {
    console.log('❌ 사용자에게 할당된 현장이 없음')
    console.log('💡 문제: RLS 정책이 현장 기반 권한을 요구할 경우 데이터 접근 불가능')
  } else {
    console.log(`✅ ${assignments.length}개 현장에 할당됨`)
    assignments.forEach((assignment: any) => {
      console.log(`   - Site ID: ${assignment.site_id} [${assignment.role}] Active: ${assignment.is_active}`)
    })
  }

  // Test data creation capability
  console.log('\n🧪 데이터 생성 테스트:')
  
  // Try to insert a test site
  console.log('현장 생성 테스트...')
  const { data: testSite, error: siteError } = await supabase
    .from('sites')
    .insert({
      name: '테스트 현장',
      address: '서울시 테스트구 테스트로 123',
      status: 'active'
    })
    .select()
    .single()
  
  if (siteError) {
    console.log('❌ 현장 생성 실패:', siteError.message)
    console.log('💡 RLS 정책이나 권한 문제로 데이터 생성 불가능')
  } else {
    console.log('✅ 테스트 현장 생성 성공:', testSite.name)
    
    // Clean up test data
    await supabase.from('sites').delete().eq('id', testSite.id)
    console.log('   (테스트 데이터 정리 완료)')
  }
}

checkRLSPolicies().catch(console.error)