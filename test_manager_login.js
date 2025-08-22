const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

async function testManagerAccount() {
  console.log('=== manager@inopnc.com 계정 시뮬레이션 테스트 ===')
  
  // Service role로 manager@inopnc.com의 상황을 정확히 시뮬레이션
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // 1. manager@inopnc.com 사용자 정보 확인
  const { data: manager, error: managerError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('email', 'manager@inopnc.com')
    .single()
  
  if (managerError || !manager) {
    console.error('Manager 계정을 찾을 수 없음:', managerError)
    return
  }
  
  console.log('Manager 정보:', manager)
  
  // 2. manager 계정의 site_assignments 확인 (서버 액션과 동일한 쿼리)
  console.log('\n=== Site Assignments 쿼리 (서버 액션 동일) ===')
  
  const { data: assignments, error: assignError } = await supabase
    .from('site_assignments')
    .select(`
      *,
      sites (
        id,
        name,
        address,
        description,
        work_process,
        work_section,
        component_name,
        manager_name,
        construction_manager_phone,
        safety_manager_name,
        safety_manager_phone,
        accommodation_name,
        accommodation_address,
        status,
        start_date,
        end_date
      )
    `)
    .eq('user_id', manager.id)
    .eq('is_active', true)
    .order('assigned_date', { ascending: false })
  
  console.log('Assignment 쿼리 결과:', { 
    assignments: assignments?.length || 0,
    error: assignError,
    data: assignments
  })
  
  if (assignError) {
    console.error('Assignment 쿼리 오류:', assignError)
    return
  }
  
  // 3. 결과 분석
  const assignment = assignments?.[0] || null
  
  if (!assignment || !assignment.sites) {
    console.log('❌ 결과: assignment 또는 sites 데이터 없음')
    console.log('assignment:', assignment)
    return
  }
  
  // 4. 데이터 변환 (서버 액션과 동일)
  const site = assignment.sites
  const siteData = {
    site_id: site.id,
    site_name: site.name,
    site_address: site.address,
    site_status: site.status,
    start_date: site.start_date,
    end_date: site.end_date,
    assigned_date: assignment.assigned_date,
    unassigned_date: assignment.unassigned_date,
    user_role: assignment.role,
    work_process: site.work_process,
    work_section: site.work_section,
    component_name: site.component_name,
    manager_name: site.manager_name,
    construction_manager_phone: site.construction_manager_phone,
    safety_manager_name: site.safety_manager_name,
    safety_manager_phone: site.safety_manager_phone,
    accommodation_name: site.accommodation_name,
    accommodation_address: site.accommodation_address,
    is_active: assignment.is_active
  }
  
  console.log('\n✅ 최종 사이트 데이터:')
  console.table(siteData)
  
  // 5. RLS 정책 확인 (manager 계정으로 직접 쿼리)
  console.log('\n=== RLS 정책 테스트 ===')
  
  // 일반 클라이언트 키로 새 클라이언트 생성 (실제 사용자와 동일)
  const clientSupabase = createClient(
    supabaseUrl, 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mzc1NjQsImV4cCI6MjA2OTQxMzU2NH0.VNyFGFPRiYTIIRgGBvehV2_wA-Fsq1dhjlvj90yvY08'
  )
  
  // manager@inopnc.com으로 로그인 시도
  const { data: authData, error: authError } = await clientSupabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  })
  
  if (authError || !authData.session) {
    console.error('RLS 테스트 로그인 실패:', authError)
    return
  }
  
  console.log('✅ RLS 테스트용 로그인 성공:', authData.user.email)
  
  // RLS가 적용된 상태에서 동일한 쿼리 실행
  const { data: rlsAssignments, error: rlsError } = await clientSupabase
    .from('site_assignments')
    .select(`
      *,
      sites (
        id,
        name,
        address,
        description,
        work_process,
        work_section,
        component_name,
        manager_name,
        construction_manager_phone,
        safety_manager_name,
        safety_manager_phone,
        accommodation_name,
        accommodation_address,
        status,
        start_date,
        end_date
      )
    `)
    .eq('user_id', manager.id)
    .eq('is_active', true)
    .order('assigned_date', { ascending: false })
  
  console.log('RLS 적용된 쿼리 결과:', {
    assignments: rlsAssignments?.length || 0,
    error: rlsError,
    data: rlsAssignments
  })
  
  if (rlsError) {
    console.error('❌ RLS 쿼리 실패:', rlsError)
    
    // Sites 테이블 직접 접근 테스트
    const { data: sitesTest, error: sitesError } = await clientSupabase
      .from('sites')
      .select('id, name')
      .limit(1)
    
    console.log('Sites 테이블 직접 접근:', { sitesTest, sitesError })
    
  } else {
    console.log('✅ RLS 정책 정상 작동 - 데이터 반환됨')
  }
  
  // 로그아웃
  await clientSupabase.auth.signOut()
}

testManagerAccount().catch(console.error)