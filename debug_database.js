const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSiteData() {
  console.log('=== 현장관리자 계정 상태 확인 ===')
  
  // 1. 현장관리자 계정들 확인
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .in('email', ['manager@inopnc.com', 'production@inopnc.com'])
  
  if (profilesError) {
    console.error('Profiles 조회 오류:', profilesError)
  } else {
    console.log('현장관리자 계정들:')
    console.table(profiles)
  }

  // 2. 모든 사이트 확인
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, address, created_at')
  
  if (sitesError) {
    console.error('Sites 조회 오류:', sitesError)
  } else {
    console.log('\n모든 사이트들:')
    console.table(sites)
  }

  // 3. site_assignments 확인
  const { data: assignments, error: assignmentsError } = await supabase
    .from('site_assignments')
    .select(`
      id,
      user_id,
      site_id,
      role,
      is_active,
      profiles!inner(email),
      sites!inner(name)
    `)
  
  if (assignmentsError) {
    console.error('Site assignments 조회 오류:', assignmentsError)
  } else {
    console.log('\n사이트 할당 상황:')
    console.table(assignments.map(a => ({
      id: a.id,
      email: a.profiles.email,
      site: a.sites.name,
      role: a.role,
      active: a.is_active
    })))
  }

  // 4. 현장관리자별 접근 가능한 사이트 확인
  if (profiles && profiles.length > 0) {
    for (const profile of profiles) {
      console.log(`\n=== ${profile.email} 접근 가능한 사이트들 ===`)
      
      // Service role로 직접 확인
      const { data: userSites, error: userSitesError } = await supabase
        .from('sites')
        .select('*')
      
      if (userSitesError) {
        console.error(`${profile.email} 사이트 접근 오류:`, userSitesError)
      } else {
        console.log(`${profile.email}이 볼 수 있는 사이트 수: ${userSites?.length || 0}`)
        console.table(userSites)
      }
    }
  }

  // 5. RLS 정책 확인
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_rls_policies')
    .catch(async () => {
      // RPC가 없다면 직접 쿼리
      const { data, error } = await supabase
        .from('pg_policies')
        .select('schemaname, tablename, policyname, permissive, roles, cmd, qual')
        .in('tablename', ['sites', 'site_assignments', 'daily_reports'])
      
      return { data, error }
    })
  
  if (policiesError) {
    console.log('\nRLS 정책 확인 불가:', policiesError.message)
  } else if (policies && policies.length > 0) {
    console.log('\nRLS 정책들:')
    console.table(policies)
  }
}

debugSiteData().catch(console.error)