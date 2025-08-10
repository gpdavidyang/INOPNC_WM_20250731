import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAPIAuth() {
  console.log('🔐 API 인증 및 데이터 접근 테스트\n')

  try {
    // 1. 실제 로그인 시뮬레이션
    console.log('1. manager@inopnc.com으로 로그인 시뮬레이션...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })

    if (authError) {
      console.log('❌ 로그인 실패:', authError.message)
      return
    }

    console.log('✅ 로그인 성공')
    console.log(`   - 사용자 ID: ${authData.user.id}`)
    console.log(`   - 이메일: ${authData.user.email}`)

    // 2. 프로필 확인
    console.log('\n2. 사용자 프로필 확인...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('❌ 프로필 조회 실패:', profileError.message)
    } else {
      console.log('✅ 프로필 조회 성공')
      console.log(`   - 이름: ${profile.full_name}`)
      console.log(`   - 역할: ${profile.role}`)
    }

    // 3. 현장 배정 확인 (RLS 정책 적용)
    console.log('\n3. 현장 배정 확인 (RLS 적용)...')
    const { data: assignments, error: assignError } = await supabase
      .from('site_assignments')
      .select(`
        id,
        site_id,
        is_active,
        assigned_date,
        sites:site_id (
          id,
          name,
          address,
          status
        )
      `)
      .eq('user_id', authData.user.id)

    if (assignError) {
      console.log('❌ 현장 배정 조회 실패:', assignError.message)
      console.log('   이것이 UI에서 데이터를 볼 수 없는 원인일 가능성이 높습니다!')
    } else {
      console.log('✅ 현장 배정 조회 성공')
      console.log(`   - 총 ${assignments.length}개 배정 발견`)
      assignments.forEach((assignment: any) => {
        console.log(`   - ${assignment.sites?.name || 'Unknown'} [활성: ${assignment.is_active}]`)
        console.log(`     Site ID: ${assignment.site_id}`)
        console.log(`     배정일: ${assignment.assigned_date}`)
      })
    }

    // 4. Database function 호출 테스트
    console.log('\n4. Database Function 호출 테스트...')
    const { data: funcResult, error: funcError } = await supabase
      .rpc('get_current_user_site_from_assignments', { user_uuid: authData.user.id })

    if (funcError) {
      console.log('❌ DB Function 호출 실패:', funcError.message)
    } else {
      console.log('✅ DB Function 호출 성공')
      console.log('   결과:', funcResult)
    }

    // 5. 현장 히스토리 함수 테스트
    console.log('\n5. 현장 히스토리 Function 테스트...')
    const { data: historyResult, error: historyError } = await supabase
      .rpc('get_user_site_history_from_assignments', { user_uuid: authData.user.id })

    if (historyError) {
      console.log('❌ 히스토리 Function 호출 실패:', historyError.message)
    } else {
      console.log('✅ 히스토리 Function 호출 성공')
      console.log('   결과 개수:', historyResult?.length || 0)
      if (historyResult && historyResult.length > 0) {
        historyResult.forEach((site: any, index: number) => {
          console.log(`   ${index + 1}. ${site.site_name} (${site.assigned_date} ~ ${site.unassigned_date || '현재'})`)
        })
      }
    }

    // 6. 로그아웃
    console.log('\n6. 로그아웃...')
    await supabase.auth.signOut()
    console.log('✅ 로그아웃 완료')

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error)
  }
}

testAPIAuth()