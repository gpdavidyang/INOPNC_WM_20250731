// 데이터베이스 상태 디버깅 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('🔍 데이터베이스 상태 확인 중...\n')

  try {
    // 1. Sites 테이블 확인
    console.log('1. Sites 테이블 확인')
    console.log('=' .repeat(50))
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address, start_date, end_date, status, created_at')
      .order('created_at', { ascending: false })
    
    if (sitesError) {
      console.error('Sites 테이블 에러:', sitesError)
    } else {
      console.log(`총 ${sites.length}개 현장 발견:`)
      sites.forEach((site, index) => {
        console.log(`  ${index + 1}. ${site.name} (ID: ${site.id})`)
        console.log(`     주소: ${site.address}`)
        console.log(`     기간: ${site.start_date} ~ ${site.end_date || '진행중'}`)
        console.log(`     상태: ${site.status}`)
        console.log(`     생성일: ${new Date(site.created_at).toLocaleDateString('ko-KR')}`)
        console.log()
      })
    }

    // 2. Site Assignments 확인
    console.log('2. Site Assignments 확인')
    console.log('=' .repeat(50))
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select(`
        id, user_id, site_id, assigned_date, unassigned_date, is_active, role,
        sites!inner(name),
        profiles!inner(full_name, email)
      `)
      .order('assigned_date', { ascending: false })
    
    if (assignmentsError) {
      console.error('Site Assignments 에러:', assignmentsError)
    } else {
      console.log(`총 ${assignments.length}개 현장 배정 발견:`)
      assignments.forEach((assignment, index) => {
        console.log(`  ${index + 1}. ${assignment.profiles.full_name} (${assignment.profiles.email})`)
        console.log(`     현장: ${assignment.sites.name}`)
        console.log(`     배정일: ${assignment.assigned_date}`)
        console.log(`     해제일: ${assignment.unassigned_date || '없음'}`)
        console.log(`     활성: ${assignment.is_active ? '예' : '아니오'}`)
        console.log(`     역할: ${assignment.role}`)
        console.log()
      })
    }

    // 3. Daily Reports 확인
    console.log('3. Daily Reports 확인')
    console.log('=' .repeat(50))
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select(`
        id, work_date, member_name, process_type, total_workers, 
        status, created_at, site_id,
        sites!inner(name)
      `)
      .order('work_date', { ascending: false })
      .limit(10)
    
    if (reportsError) {
      console.error('Daily Reports 에러:', reportsError)
    } else {
      console.log(`총 ${reports.length}개 작업일지 발견 (최근 10개):`)
      reports.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.sites.name} - ${report.work_date}`)
        console.log(`     부재명: ${report.member_name}`)
        console.log(`     공정: ${report.process_type}`)
        console.log(`     작업자수: ${report.total_workers || '미기입'}`)
        console.log(`     상태: ${report.status}`)
        console.log(`     생성일: ${new Date(report.created_at).toLocaleDateString('ko-KR')}`)
        console.log()
      })
    }

    // 4. Profiles 확인
    console.log('4. Profiles 확인')
    console.log('=' .repeat(50))
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (profilesError) {
      console.error('Profiles 에러:', profilesError)
    } else {
      console.log(`총 ${profiles.length}개 사용자 프로필 발견 (최근 10개):`)
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.full_name} (${profile.email})`)
        console.log(`     역할: ${profile.role}`)
        console.log(`     상태: ${profile.status}`)
        console.log(`     가입일: ${new Date(profile.created_at).toLocaleDateString('ko-KR')}`)
        console.log()
      })
    }

    // 5. 현재 날짜 기준으로 최근 데이터 확인
    console.log('5. 최근 3개월 데이터 확인')
    console.log('=' .repeat(50))
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsAgoString = threeMonthsAgo.toISOString().split('T')[0]

    const { data: recentReports, error: recentError } = await supabase
      .from('daily_reports')
      .select('id, work_date, sites!inner(name)')
      .gte('work_date', threeMonthsAgoString)
      .order('work_date', { ascending: false })
    
    if (recentError) {
      console.error('최근 데이터 확인 에러:', recentError)
    } else {
      console.log(`최근 3개월 작업일지: ${recentReports.length}개`)
      if (recentReports.length > 0) {
        console.log('최신 5개:')
        recentReports.slice(0, 5).forEach((report, index) => {
          console.log(`  ${index + 1}. ${report.sites.name} - ${report.work_date}`)
        })
      }
    }

    // 6. 테스트 사용자 현장 배정 상태 확인
    console.log('\n6. 테스트 사용자들의 현장 배정 상태')
    console.log('=' .repeat(50))
    const testEmails = [
      'worker@inopnc.com',
      'manager@inopnc.com', 
      'customer@inopnc.com',
      'admin@inopnc.com'
    ]

    for (const email of testEmails) {
      const { data: user } = await supabase
        .from('profiles')
        .select(`
          id, full_name, email, role,
          site_assignments!inner(
            id, site_id, assigned_date, unassigned_date, is_active,
            sites!inner(name)
          )
        `)
        .eq('email', email)
        .single()

      if (user) {
        console.log(`${user.full_name} (${user.email}) - ${user.role}:`)
        if (user.site_assignments && user.site_assignments.length > 0) {
          user.site_assignments.forEach(assignment => {
            console.log(`  → ${assignment.sites.name} (배정일: ${assignment.assigned_date}, 활성: ${assignment.is_active})`)
          })
        } else {
          console.log('  → 배정된 현장 없음')
        }
      } else {
        console.log(`${email}: 사용자를 찾을 수 없음`)
      }
      console.log()
    }

  } catch (error) {
    console.error('전체 에러:', error)
  }
}

debugDatabase()