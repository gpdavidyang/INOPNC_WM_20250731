import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function finalVerificationTest() {
  console.log('🎯 최종 검증 테스트 시작...\n')
  
  try {
    // 1. 인증 테스트
    console.log('=== Step 1: 인증 테스트 ===')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ 인증 실패:', authError.message)
      return
    }
    
    console.log('✅ 인증 성공:', authData.user?.email)
    console.log('✅ 사용자 ID:', authData.user?.id)
    
    // 2. 프로필 조회
    console.log('\n=== Step 2: 프로필 조회 ===')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single()
    
    if (profileError) {
      console.error('❌ 프로필 조회 실패:', profileError.message)
      return
    }
    
    console.log('✅ 프로필 조회 성공:', {
      role: profile.role,
      email: profile.email,
      name: profile.full_name
    })
    
    // 3. 작업일지 쿼리 (UI와 동일한 쿼리)
    console.log('\n=== Step 3: 작업일지 쿼리 (UI와 동일) ===')
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
        sites(
          id,
          name
        )
      `)
      .order('work_date', { ascending: false })
      .limit(50)

    // 역할에 따른 필터링 (UI와 동일한 로직)
    if (profile.role === 'worker') {
      console.log('🔍 작업자 필터 적용')
      query.eq('created_by', profile.id)
    } else {
      console.log('🔍 관리자/현장관리자 - 모든 데이터 접근 가능')
    }

    const { data: workLogs, error: workLogsError } = await query

    if (workLogsError) {
      console.error('❌ 작업일지 쿼리 실패:', workLogsError.message)
      return
    }

    console.log(`✅ 작업일지 쿼리 성공! ${workLogs?.length || 0}개 발견`)
    
    // 4. 데이터 변환 테스트 (UI와 동일한 로직)
    if (workLogs && workLogs.length > 0) {
      console.log('\n=== Step 4: 데이터 변환 테스트 ===')
      
      const transformedLogs = workLogs.map(report => ({
        id: report.id,
        work_date: report.work_date,
        site_name: report.sites?.name || 'Unknown Site',
        work_content: `${report.member_name || ''} - ${report.process_type || ''}: ${report.issues || ''}`,
        status: (report.status === 'approved' || report.status === 'submitted') ? 'submitted' : 'draft',
        created_at: report.created_at,
        updated_at: report.updated_at,
        created_by_name: 'Site Manager',
        site_id: report.site_id
      }))
      
      console.log('✅ 데이터 변환 성공!')
      console.log('\n📋 변환된 데이터 샘플:')
      transformedLogs.slice(0, 3).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.work_date}`)
        console.log(`      현장: ${log.site_name}`)
        console.log(`      내용: ${log.work_content}`)
        console.log(`      상태: ${log.status}`)
        console.log(`      ID: ${log.id}`)
        console.log('')
      })
      
      // 5. 상태별 통계
      console.log('=== Step 5: 상태별 통계 ===')
      const statusCounts = transformedLogs.reduce((acc: any, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1
        return acc
      }, {})
      
      console.log('📊 상태별 분포:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        const statusName = status === 'draft' ? '임시저장' : '제출됨'
        console.log(`   - ${statusName}: ${count}건`)
      })
    }
    
    // 6. 사이트 정보 확인
    console.log('\n=== Step 6: 사이트 정보 확인 ===')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
    
    if (sitesError) {
      console.error('❌ 사이트 조회 실패:', sitesError.message)
    } else {
      console.log(`✅ 사이트 조회 성공! ${sites?.length || 0}개 사이트`)
      sites?.forEach((site, index) => {
        console.log(`   ${index + 1}. ${site.name} (ID: ${site.id})`)
      })
    }
    
    console.log('\n🎉 모든 테스트 완료!')
    console.log('✨ 작업일지 탭이 정상적으로 작동할 것으로 예상됩니다.')
    console.log('🌐 브라우저에서 http://localhost:3000/dashboard 접속 후')
    console.log('   하단 네비게이션의 "작업일지" 탭을 클릭해보세요!')
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error)
  } finally {
    await supabase.auth.signOut()
    console.log('\n✅ 로그아웃 완료')
  }
}

finalVerificationTest()