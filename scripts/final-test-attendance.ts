import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function finalTestAttendance() {
  console.log('🔍 출근현황 최종 테스트...\n')
  
  const testUsers = [
    { email: 'worker@inopnc.com', password: 'password123', role: '작업자' },
    { email: 'manager@inopnc.com', password: 'password123', role: '현장관리자' },
    { email: 'admin@inopnc.com', password: 'password123', role: '관리자' }
  ]
  
  for (const user of testUsers) {
    console.log(`\n📝 ${user.role} 계정 테스트 (${user.email})`)
    console.log('=' + '='.repeat(50))
    
    // 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    })
    
    if (authError) {
      console.error(`❌ 로그인 실패: ${authError.message}`)
      continue
    }
    
    console.log(`✅ 로그인 성공`)
    
    // 8월 출근 데이터 조회
    const currentMonth = new Date()
    const selectedYear = currentMonth.getFullYear()
    const selectedMonth = currentMonth.getMonth() + 1
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
    
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select(`
        id,
        work_date,
        check_in_time,
        check_out_time,
        status,
        work_hours,
        overtime_hours,
        labor_hours,
        notes,
        site_id,
        sites(name)
      `)
      .eq('user_id', authData.user?.id)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: false })
    
    if (attendanceError) {
      console.error(`❌ 출근 데이터 조회 실패: ${attendanceError.message}`)
    } else {
      console.log(`✅ 출근 데이터 조회 성공: ${attendanceData?.length || 0}건`)
      
      if (attendanceData && attendanceData.length > 0) {
        // 통계 계산
        const totalLaborHours = attendanceData.reduce((sum, record) => {
          return sum + (record.labor_hours || 0)
        }, 0)
        
        const workDays = attendanceData.filter(record => 
          record.labor_hours && record.labor_hours > 0
        ).length
        
        const uniqueSites = new Set(
          attendanceData
            .filter(record => record.sites?.name)
            .map(record => record.sites.name)
        ).size
        
        console.log(`\n📊 ${selectedYear}년 ${selectedMonth}월 통계:`)
        console.log(`  - 작업일: ${workDays}일`)
        console.log(`  - 총 공수: ${totalLaborHours.toFixed(1)}`)
        console.log(`  - 현장 수: ${uniqueSites}개`)
        
        // 최근 3개 기록 표시
        console.log(`\n📅 최근 출근 기록:`)
        attendanceData.slice(0, 3).forEach(record => {
          console.log(`  ${record.work_date}: ${record.sites?.name || '미지정'} - ${record.labor_hours?.toFixed(1) || 0}공수`)
        })
      }
    }
    
    // 로그아웃
    await supabase.auth.signOut()
  }
  
  console.log('\n' + '='.repeat(52))
  console.log('✨ 테스트 완료!')
  console.log('\n💡 해결 사항:')
  console.log('  1. DB의 labor_hours 필드를 직접 사용하도록 수정')
  console.log('  2. 세션 확인 및 갱신 로직 추가')
  console.log('  3. 디버깅을 위한 콘솔 로그 추가')
  console.log('\n🌐 브라우저에서 확인:')
  console.log('  http://localhost:3001/dashboard/attendance')
}

finalTestAttendance()