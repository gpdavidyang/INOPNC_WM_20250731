import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseBrowserIssue() {
  console.log('🔍 브라우저 이슈 진단 시작...\n')
  
  try {
    // 1. Sign in as the same user as in the browser
    console.log('=== Step 1: 브라우저와 동일한 사용자로 로그인 ===')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ 인증 오류:', authError)
      return
    }
    
    console.log('✅ 로그인 성공:', authData.user?.email)
    console.log('✅ 사용자 ID:', authData.user?.id)
    
    // Verify this matches the browser logs (950db250-82e4-4c9d-bf4d-75df7244764c)
    if (authData.user?.id === '950db250-82e4-4c9d-bf4d-75df7244764c') {
      console.log('✅ 브라우저와 동일한 사용자 ID 확인됨')
    } else {
      console.log('❌ 브라우저와 다른 사용자 ID!')
    }
    
    // 2. Get profile like the browser does
    console.log('\n=== Step 2: 프로필 조회 (브라우저와 동일) ===')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ 프로필 오류:', profileError)
      return
    }
    
    console.log('✅ 프로필:', {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name
    })
    
    // 3. Test the exact query from work-logs-tab.tsx
    console.log('\n=== Step 3: work-logs-tab.tsx의 정확한 쿼리 실행 ===')
    
    // First, simulate the auth check that the component does
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[DEBUG] Current auth user:', { 
      user: user?.email, 
      userId: user?.id,
      error: userError?.message 
    })
    
    console.log('[DEBUG] Profile vs Auth comparison:', {
      profileId: profile.id,
      authUserId: user?.id,
      match: profile.id === user?.id
    })
    
    // Now run the exact same query as the component
    console.log('\n브라우저 컴포넌트와 정확히 동일한 쿼리 실행 중...')
    
    const query = supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        issues,
        status,
        created_at,
        updated_at,
        site_id,
        created_by,
        sites!inner(
          id,
          name
        )
      `)
      .order('work_date', { ascending: false })
      .limit(50)
    
    // Apply the same role-based filtering as the component
    if (profile.role === 'worker') {
      console.log('[DEBUG] Applying worker filter for user:', profile.id)
      query.eq('created_by', profile.id)
    } else {
      console.log('[DEBUG] No role filter applied - user role:', profile.role)
    }
    
    const { data, error } = await query
    
    console.log('[DEBUG] Query completed:', { 
      success: !error, 
      count: data?.length || 0,
      error: error?.message
    })
    
    // Also test the simple query from the component
    const { data: simpleData, error: simpleError } = await supabase
      .from('daily_reports')
      .select('id, work_date, status')
      .limit(5)
    
    console.log('[DEBUG] Simple query (no joins):', {
      success: !simpleError,
      count: simpleData?.length || 0,
      error: simpleError?.message
    })
    
    if (error) {
      console.error('❌ 쿼리 오류:', error)
      
      // Try to understand the error better
      if (error.message.includes('permission')) {
        console.log('🔍 권한 관련 오류 - RLS 정책 확인 필요')
      } else if (error.message.includes('relation')) {
        console.log('🔍 관계 관련 오류 - 테이블 조인 확인 필요')
      } else {
        console.log('🔍 알 수 없는 오류:', error)
      }
    } else {
      console.log(`✅ 쿼리 성공! ${data?.length || 0}개 결과 발견`)
      
      if (data && data.length > 0) {
        console.log('🔍 첫 번째 결과:', {
          id: data[0].id,
          work_date: data[0].work_date,
          site_name: data[0].sites?.name,
          member_name: data[0].member_name,
          status: data[0].status,
          created_by: data[0].created_by
        })
        
        // Show transformation like the component does
        const transformedLog = {
          id: data[0].id,
          work_date: data[0].work_date,
          site_name: data[0].sites?.name || 'Unknown Site',
          work_content: `${data[0].member_name || ''} - ${data[0].process_type || ''}: ${data[0].issues || ''}`,
          status: (data[0].status === 'approved' || data[0].status === 'submitted') ? 'submitted' : 'draft',
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          created_by_name: 'Site Manager',
          site_id: data[0].site_id
        }
        
        console.log('🔄 변환된 데이터 (컴포넌트와 동일):', transformedLog)
      }
    }
    
    // 4. Check if there might be timing issues
    console.log('\n=== Step 4: 타이밍 이슈 체크 ===')
    
    // Wait a bit and try again
    console.log('1초 대기 후 재시도...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: retryData, error: retryError } = await supabase
      .from('daily_reports')
      .select('id, work_date, status')
      .limit(3)
    
    console.log('재시도 결과:', {
      success: !retryError,
      count: retryData?.length || 0,
      error: retryError?.message
    })
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error)
  } finally {
    await supabase.auth.signOut()
    console.log('\n✅ 로그아웃 완료')
  }
}

diagnoseBrowserIssue()