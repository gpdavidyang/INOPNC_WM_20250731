import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  console.log('🔍 데이터베이스 데이터 확인 중...\n')

  // Check profiles
  console.log('👥 Profiles 테이블:')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
  
  if (profilesError) {
    console.log('❌ Profiles 조회 실패:', profilesError.message)
  } else {
    console.log(`📊 총 ${profiles?.length || 0}개 프로필`)
    profiles?.slice(0, 5).forEach((profile: any) => {
      console.log(`   - ${profile.full_name} (${profile.email}) [${profile.role}] - ${new Date(profile.created_at).toLocaleString('ko-KR')}`)
    })
  }

  console.log('\n🏗️ Sites 테이블:')
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, address, status, created_at')
    .order('created_at', { ascending: false })
  
  if (sitesError) {
    console.log('❌ Sites 조회 실패:', sitesError.message)
  } else {
    console.log(`📊 총 ${sites?.length || 0}개 현장`)
    sites?.slice(0, 5).forEach((site: any) => {
      console.log(`   - ${site.name} (${site.address}) [${site.status}] - ${new Date(site.created_at).toLocaleString('ko-KR')}`)
    })
  }

  console.log('\n📝 Daily Reports 테이블:')
  const { data: reports, error: reportsError } = await supabase
    .from('daily_reports')
    .select('id, member_name, work_date, status, created_at')
    .order('created_at', { ascending: false })
  
  if (reportsError) {
    console.log('❌ Daily Reports 조회 실패:', reportsError.message)
  } else {
    console.log(`📊 총 ${reports?.length || 0}개 일일보고서`)
    reports?.slice(0, 5).forEach((report: any) => {
      console.log(`   - ${report.member_name} (${report.work_date}) [${report.status}] - ${new Date(report.created_at).toLocaleString('ko-KR')}`)
    })
  }

  console.log('\n🎯 Site Assignments 테이블:')
  const { data: assignments, error: assignmentsError } = await supabase
    .from('site_assignments')
    .select('user_id, site_id, role, is_active, created_at')
    .order('created_at', { ascending: false })
  
  if (assignmentsError) {
    console.log('❌ User Site Assignments 조회 실패:', assignmentsError.message)
  } else {
    console.log(`📊 총 ${assignments?.length || 0}개 사용자-현장 할당`)
    assignments?.slice(0, 5).forEach((assignment: any) => {
      console.log(`   - User: ${assignment.user_id.substring(0,8)}... Site: ${assignment.site_id.substring(0,8)}... [${assignment.role}] Active: ${assignment.is_active} - ${new Date(assignment.created_at).toLocaleString('ko-KR')}`)
    })
  }

  console.log('\n📅 최근 데이터 타임스탬프:')
  
  // Get most recent timestamps
  const tables = [
    { name: 'profiles', data: profiles },
    { name: 'sites', data: sites },
    { name: 'daily_reports', data: reports },
    { name: 'site_assignments', data: assignments }
  ]

  tables.forEach(table => {
    if (table.data && table.data.length > 0) {
      const mostRecent = table.data[0] // Already sorted by created_at desc
      console.log(`   - ${table.name}: ${new Date(mostRecent.created_at).toLocaleString('ko-KR')} (가장 최근)`)
    }
  })

  console.log('\n🔒 RLS 정책 확인 중...')
  
  // Check if RLS is enabled on tables
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('check_rls_status')
    .catch(async () => {
      // Fallback: try to query pg_tables to see RLS status
      return await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
    })

  console.log('\n🚫 인증 상태 확인:')
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.log('❌ 인증 확인 실패:', authError.message)
  } else if (user) {
    console.log(`✅ 사용자 인증됨: ${user.email} (ID: ${user.id.substring(0,8)}...)`)
    
    // Check if this user has a profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.log('❌ 사용자 프로필 없음:', profileError.message)
    } else {
      console.log(`✅ 사용자 프로필 존재: ${userProfile.full_name} [${userProfile.role}]`)
    }
  } else {
    console.log('❌ 사용자 인증되지 않음 (익명 액세스)')
  }
}

checkData().catch(console.error)