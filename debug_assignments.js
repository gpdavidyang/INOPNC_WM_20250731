const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAndFixAssignments() {
  console.log('=== Site Assignments 테이블 구조 확인 ===')
  
  // 1. 테이블 존재 여부 확인 - 간단하게 SELECT 시도
  console.log('site_assignments 테이블 확인 중...')

  // 2. 테이블이 존재한다면 모든 assignments 확인
  const { data: allAssignments, error: assignError } = await supabase
    .from('site_assignments')
    .select('*')
  
  if (assignError) {
    console.error('Site assignments 조회 오류:', assignError)
  } else {
    console.log('현재 사이트 할당 수:', allAssignments?.length || 0)
    if (allAssignments && allAssignments.length > 0) {
      console.table(allAssignments)
    }
  }

  // 3. site_memberships 테이블도 확인
  const { data: memberships, error: memberError } = await supabase
    .from('site_memberships')
    .select('*')
  
  if (memberError) {
    console.log('site_memberships 테이블 없음 또는 오류:', memberError.message)
  } else {
    console.log('site_memberships 데이터 수:', memberships?.length || 0)
    if (memberships && memberships.length > 0) {
      console.table(memberships)
    }
  }

  // 4. 현장관리자 계정들을 사이트에 할당
  console.log('\n=== 현장관리자 사이트 할당 시작 ===')
  
  const managerEmails = ['manager@inopnc.com', 'production@inopnc.com']
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', managerEmails)
  
  const { data: activeSites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('status', 'active')
    .limit(3) // 처음 3개 활성 사이트만

  if (managers && activeSites && managers.length > 0 && activeSites.length > 0) {
    console.log('할당할 관리자들:', managers.map(m => m.email))
    console.log('할당할 사이트들:', activeSites.map(s => s.name))

    // manager@inopnc.com을 첫 번째 사이트에 할당
    const { data: assignment1, error: error1 } = await supabase
      .from('site_assignments')
      .insert({
        user_id: managers.find(m => m.email === 'manager@inopnc.com')?.id,
        site_id: activeSites[0].id,
        role: 'site_manager',
        is_active: true,
        assigned_by: managers[0].id,
        assigned_at: new Date().toISOString()
      })
      .select()

    if (error1) {
      console.error('manager@inopnc.com 할당 오류:', error1)
    } else {
      console.log('manager@inopnc.com 할당 성공:', activeSites[0].name)
    }

    // production@inopnc.com을 두 번째 사이트에 할당
    if (activeSites.length > 1) {
      const { data: assignment2, error: error2 } = await supabase
        .from('site_assignments')
        .insert({
          user_id: managers.find(m => m.email === 'production@inopnc.com')?.id,
          site_id: activeSites[1].id,
          role: 'site_manager',
          is_active: true,
          assigned_by: managers[0].id,
          assigned_at: new Date().toISOString()
        })
        .select()

      if (error2) {
        console.error('production@inopnc.com 할당 오류:', error2)
      } else {
        console.log('production@inopnc.com 할당 성공:', activeSites[1].name)
      }
    }

    // 최종 확인
    console.log('\n=== 할당 후 확인 ===')
    const { data: finalAssignments } = await supabase
      .from('site_assignments')
      .select(`
        *,
        profiles!inner(email),
        sites!inner(name)
      `)

    if (finalAssignments && finalAssignments.length > 0) {
      console.table(finalAssignments.map(a => ({
        email: a.profiles.email,
        site: a.sites.name,
        role: a.role,
        active: a.is_active
      })))
    }
  }
}

debugAndFixAssignments().catch(console.error)